package com.marklogic.hub.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.marklogic.hub.ApplicationConfig;
import com.marklogic.hub.HubConfig;
import com.marklogic.hub.HubTestBase;
import com.marklogic.mgmt.api.database.Database;
import com.marklogic.mgmt.api.database.ElementIndex;
import com.marklogic.mgmt.util.ObjectMapperFactory;
import org.apache.commons.io.FileUtils;
import org.custommonkey.xmlunit.XMLUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.w3c.dom.Document;

import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import static org.custommonkey.xmlunit.XMLAssert.assertXMLEqual;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests various upgrade scenarios. General approach is to copy a stubbed out project from
 * src/test/resources/upgrade-projects into the build directory (a non-version-controlled area) where it
 * can then be upgraded and verified.
 */
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = ApplicationConfig.class)
public class UpgradeProjectTest extends HubTestBase {

    @Autowired
    FlowManagerImpl flowManager;

    @Autowired
    HubProjectImpl hubProject;

    @Autowired
    Versions versions;

    @AfterEach
    public void cleanup() {
        deleteProjectDir();
    }

    @Test
    public void upgrade43xToCurrentVersion() throws IOException {
        final String projectPath = "build/tmp/upgrade-projects/dhf43x";
        final File projectDir = Paths.get(projectPath).toFile();
        FileUtils.deleteDirectory(projectDir);
        FileUtils.copyDirectory(Paths.get("src/test/resources/upgrade-projects/dhf43x").toFile(), projectDir);

        hubProject.createProject(projectPath);

        // This test is a little awkward because it's not clear if dataHub.upgradeProject can just be called in the
        // context of this test. So instead, some of the methods called by that method are called directly here.
        dataHub.prepareProjectBeforeUpgrading(hubProject, "5.0.3");
        hubProject.init(createMap());
        hubProject.upgradeProject();

        File mappingDir = new File(projectDir, "mappings");
        File entitiesDir = new File(projectDir, "entities");
        verifyDirContents(mappingDir, 1);
        verifyDirContents(entitiesDir, 3);

        File finalDbFile = hubProject.getUserConfigDir().resolve("databases").resolve("final-database.json").toFile();
        ObjectNode db = (ObjectNode) ObjectMapperFactory.getObjectMapper().readTree(finalDbFile);
        assertFalse(db.has("range-element-index"),
            "range-element-index should have been removed because it was set to an empty array, which can cause " +
                "unnecessary reindexing");
        assertEquals("Parent", db.get("range-element-attribute-index").get(0).get("parent-localname").asText(),
            "Other existing indexes should have been retained though; only range-element-index should have been removed");

        File internalConfigBackupDir = hubProject.getProjectDir().resolve("src").resolve("main").resolve("hub-internal-config-5.0.3").toFile();
        assertTrue(internalConfigBackupDir.exists(), "The prepareProjectBeforeUpgrading method should backup the " +
            "hub-internal-config directory in the rare event that a user has made changes to this directory and doesn't want to " +
            "lose them (though a user really shouldn't be doing that)");

        File mlConfigBackupDir = hubProject.getProjectDir().resolve("src").resolve("main").resolve("ml-config-5.0.3").toFile();
        assertFalse(mlConfigBackupDir.exists(), "As of DHFPROD-3159, ml-config should no longer be backed up. DHF rarely needs to " +
            "change the files in this directory, and when it does need to, it'll make changes directly to the files so as to not " +
            "lose changes made by users.");

        File mappingFunctionsDir = hubProject.getCustomMappingFunctionsDir().toFile();
        assertTrue(mappingFunctionsDir.exists(), "The initialization process should stub out the directory for " +
            "mapping functions so that the user has more of a clue as to where they go");

        File finalFieldsFile = hubProject.getUserConfigDir().resolve("database-fields").resolve("final-database.xml").toFile();
        assertTrue(finalFieldsFile.exists());

        File stagingFieldsFile = hubProject.getHubConfigDir().resolve("database-fields").resolve("staging-database.xml").toFile();
        assertTrue(stagingFieldsFile.exists());

        File jobFieldsFile = hubProject.getHubConfigDir().resolve("database-fields").resolve("job-database.xml").toFile();
        assertTrue(jobFieldsFile.exists());

        assertTrue(hubProject.getHubSecurityDir().resolve("roles").resolve("data-hub-job-reader.json").toFile().exists());
        assertTrue(hubProject.getHubSecurityDir().resolve("roles").resolve("data-hub-job-internal.json").toFile().exists());
        assertTrue(hubProject.getHubSecurityDir().resolve("roles").resolve("data-hub-flow-reader.json").toFile().exists());
        assertTrue(hubProject.getHubSecurityDir().resolve("roles").resolve("data-hub-flow-writer.json").toFile().exists());
        assertTrue(hubProject.getHubSecurityDir().resolve("roles").resolve("data-hub-module-writer.json").toFile().exists());
        assertTrue(hubProject.getHubSecurityDir().resolve("roles").resolve("data-hub-mapping-reader.json").toFile().exists());
        assertTrue(hubProject.getHubSecurityDir().resolve("roles").resolve("data-hub-mapping-writer.json").toFile().exists());
        assertTrue(hubProject.getHubSecurityDir().resolve("roles").resolve("data-hub-step-definition-reader.json").toFile().exists());
        assertTrue(hubProject.getHubSecurityDir().resolve("roles").resolve("data-hub-step-definition-writer.json").toFile().exists());
        assertTrue(hubProject.getHubSecurityDir().resolve("roles").resolve("data-hub-entity-model-reader.json").toFile().exists());
        assertTrue(hubProject.getHubSecurityDir().resolve("roles").resolve("data-hub-entity-model-writer.json").toFile().exists());
        assertTrue(hubProject.getHubSecurityDir().resolve("amps").resolve("amps-dhf-update-batch.json").toFile().exists());
        assertTrue(hubProject.getHubSecurityDir().resolve("amps").resolve("amps-dhf-update-job.json").toFile().exists());

        ObjectMapper mapper = new ObjectMapper();
        File flowOpRole = hubProject.getHubSecurityDir().resolve("roles").resolve("flow-operator-role.json").toFile();
        assertTrue(mapper.readTree(flowOpRole).get("role").toString().contains("data-hub-operator"), "As of DHFPROD-3619, flow-operator-role should inherit data-hub-operator");

        File flowDevRole = hubProject.getHubSecurityDir().resolve("roles").resolve("flow-developer-role.json").toFile();
        assertTrue(mapper.readTree(flowDevRole).get("role").toString().contains("data-hub-developer"), "As of DHFPROD-3619, flow-developer-role should inherit data-hub-developer");

        //per DHFPROD-3617, following properties shouldn't be there in gradle.properties after hubInit is run. Users can adjust these if needed
        String props = FileUtils.readFileToString(hubProject.getProjectDir().resolve("gradle.properties").toFile());
        assertFalse(props.contains("mlEntityPermissions"));
        assertFalse(props.contains("mlFlowPermissions"));
        assertFalse(props.contains("mlMappingPermissions"));
        assertFalse(props.contains("mlStepDefinitionPermissions"));
        assertFalse(props.contains("mlJobPermissions"));
        assertFalse(props.contains("mlModulePermissions"));

        //Ensure the path index from DHFPROD-3911 is added to xml payload
        XMLUnit.setIgnoreWhitespace(true);
        Document expected = getXmlFromResource("upgrade-projects/dhf43x/key/final-database.xml" );
        Document actual = getXmlFromInputStream(FileUtils.openInputStream(hubProject.getUserConfigDir().resolve("database-fields").resolve("final-database.xml").toFile()));
        assertXMLEqual(expected, actual);

    }

    @Test
    public void hasEmptyRangeElementIndexArray() {
        HubProjectImpl project = new HubProjectImpl();

        Database db = new Database(null, "data-hub-FINAL");
        assertFalse(project.hasEmptyRangeElementIndexArray(db.toObjectNode()),
            "False should be returned since the range-element-index field isn't set");

        db.setRangeElementIndex(new ArrayList<>());
        assertTrue(project.hasEmptyRangeElementIndexArray(db.toObjectNode()));

        ElementIndex index = new ElementIndex();
        index.setLocalname("example");
        db.getRangeElementIndex().add(index);
        assertFalse(new HubProjectImpl().hasEmptyRangeElementIndexArray(db.toObjectNode()));
    }

    @Test
    public void testUpgradeTo510MappingStep() {
        createProjectDir();
        adminHubConfig.createProject(PROJECT_PATH);
        Assumptions.assumingThat(versions.isVersionCompatibleWithES(), () -> {
            FileUtils.copyFileToDirectory(getResourceFile("mapping-test/flows/CustomerXML.flow.json"), adminHubConfig.getFlowsDir().toFile());
            FileUtils.copyDirectory(getResourceFile("flow-runner-test/flows"), adminHubConfig.getFlowsDir().toFile());
            project.upgradeFlows();
            Assertions.assertEquals("entity-services-mapping", flowManager.getFlow("testFlow").getStep("6").getStepDefinitionName());
            Assertions.assertEquals("entity-services-mapping", flowManager.getFlow("CustomerXML").getStep("2").getStepDefinitionName());
        });
    }

    private Map<String, String> createMap() {
        Map<String, String> myMap = new HashMap<>();
        myMap.put("%%mlStagingSchemasDbName%%", HubConfig.DEFAULT_STAGING_SCHEMAS_DB_NAME);
        return myMap;
    }

    private void verifyDirContents(File dir, int expectedCount) {
        assertEquals(expectedCount, dir.listFiles().length);
    }
}
