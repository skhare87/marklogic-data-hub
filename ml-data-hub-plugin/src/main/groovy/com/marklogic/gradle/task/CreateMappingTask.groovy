/*
 * Copyright 2012-2018 MarkLogic Corporation
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

package com.marklogic.gradle.task

import com.marklogic.gradle.exception.MappingNameRequiredException
import com.marklogic.hub.MappingManager
import com.marklogic.hub.scaffold.Scaffolding
import org.gradle.api.tasks.TaskAction

class CreateMappingTask extends HubTask {

    @TaskAction
    void createMapping() {
        def propName = "mappingName"
        def mappingName = project.hasProperty(propName) ? project.property(propName) : null
        if (mappingName == null) {
            throw new MappingNameRequiredException()
        }
        def projectDir = getHubConfig().projectDir
        println "mappingName: " + mappingName
        println "projectDir: " + projectDir.toString()
        Scaffolding scaffolding = Scaffolding.create(projectDir, getFinalClient())
        scaffolding.createMappingDir(mappingName)
        MappingManager mappingManager = MappingManager.getMappingManager(hubConfig)
        def mapping = mappingManager.createMapping(mappingName)
        mappingManager.saveMapping(mapping)
    }
}
