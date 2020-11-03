import React, {useState} from 'react';
import { Modal, Tabs } from 'antd';
import CreateEditLoad from '../load/create-edit-load/create-edit-load';
import CreateEditMapping from '../entities/mapping/create-edit-mapping/create-edit-mapping';
import CreateEditStepDialog from '../entities/create-edit-step-dialog/create-edit-step-dialog';
import ViewCustom from '../entities/custom/view-custom/view-custom';
import AdvancedSettingsDialog from "../advanced-settings/advanced-settings-dialog";
import ConfirmYesNo from '../common/confirm-yes-no/confirm-yes-no';
import styles from './steps.module.scss';
import './steps.scss';
import { StepType } from '../../types/curation-types';
  
const { TabPane } = Tabs;

interface Props {
    isNewStep: boolean;
    createStep?: any;
    updateStep?: any;
    stepData: any;
    sourceDatabase?: any;
    canReadWrite: any;
    canReadOnly: any;
    tooltipsData: any;
    openStepSettings: any;
    setOpenStepSettings: any;
    activityType: string;
    canWrite?: any;
    targetEntityType?: any;
    toggleModal?: any;
}

const DEFAULT_TAB = '1';
  
const Steps: React.FC<Props> = (props) => {
    const [currentTab, setCurrentTab] = useState(DEFAULT_TAB);
    const [isValid, setIsValid] = useState(true);
    const [hasChanged, setHasChanged] = useState(false);
    const [discardChangesVisible, setDiscardChangesVisible] = useState(false);

    const onCancel = () => {
        if (hasChanged) {
            setDiscardChangesVisible(true);
        } else {
            props.setOpenStepSettings(false);
            resetTabs();
        }
    }

    const discardOk = () => {
        setDiscardChangesVisible(false);
        props.setOpenStepSettings(false);
        resetTabs();
    }
    
    const discardCancel = () => {
        setDiscardChangesVisible(false);
    }

    const discardChanges = <ConfirmYesNo
        visible={discardChangesVisible}
        body='Discard changes?'
        onYes={discardOk}
        onNo={discardCancel}
    />;

    const resetTabs = () => {
        setCurrentTab(DEFAULT_TAB);
    }

    const handleTabChange = (key) => {
        setHasChanged(false);
        setCurrentTab(key);
    }

    const createEditDefaults = {
        tabKey: '1',
        openStepSettings: props.openStepSettings,
        setOpenStepSettings: props.setOpenStepSettings,
        stepData: props.stepData,
        canReadWrite: props.canReadWrite,
        canReadOnly: props.canReadOnly,
        currentTab: currentTab,
        setIsValid: setIsValid,
        resetTabs: resetTabs,
        setHasChanged: setHasChanged
    }

    const createEditLoad = (<CreateEditLoad
        {...createEditDefaults}
        isNewStep={props.isNewStep}
        createLoadArtifact={props.createStep}
    />);

    const createEditMapping = (<CreateEditMapping
        {...createEditDefaults}
        isNewStep={props.isNewStep}
        createMappingArtifact={props.createStep}
    />);

    const createEditMatching = (<CreateEditStepDialog
        {...createEditDefaults}
        isEditing={!props.isNewStep}
        editStepArtifactObject={props.stepData}
        stepType={StepType.Matching}
        targetEntityType={props.targetEntityType}
        createStepArtifact={props.createStep}
        toggleModal={props.toggleModal}
    />);

    // TODO fill in correct props for merging
    const createEditMerging = (<CreateEditStepDialog
        {...createEditDefaults}
        isEditing={!props.isNewStep}
        editStepArtifactObject={props.createStep}
        stepType={StepType.Matching}
        targetEntityType={props.targetEntityType}
        createStepArtifact={props.createStep}
        toggleModal={props.toggleModal}
    />);

    const viewCustom = (<ViewCustom
        {...createEditDefaults}
    />);

    const getCreateEditStep = (activityType) => {
        if (activityType === 'ingestion') {
            return createEditLoad;
        } else if (activityType === StepType.Mapping) {
            return createEditMapping;
        } else if (activityType === StepType.Matching) {
            return createEditMatching;
        } else if (activityType === StepType.Merging) {
            return createEditMapping;
        } else {
            return viewCustom;
        }
    }

    const getTitle = () => {
        let activity;
        switch(props.activityType) {
            case 'ingestion': activity = 'Loading';
                break;
            case StepType.Mapping: activity = 'Mapping';
                break;
            case StepType.Matching: activity = 'Matching';
                break;
            case StepType.Merging: activity = 'Merging';
                break;
            default: activity = 'Custom';
        }
        return props.isNewStep ? 'New ' + activity + ' Step' : activity + ' Step Settings'; 
    }

    return <Modal
        visible={props.openStepSettings}
        title={null}
        width="700px"
        onCancel={() => onCancel()}
        className={styles.SettingsModal}
        footer={null}
        maskClosable={false}
        destroyOnClose={true}
    >
        <div className={styles.settingsContainer}>
            <header>
                <div className={styles.title}>{getTitle()}</div>
            </header>
            { props.isNewStep ? <div className={styles.noTabs}>
                {getCreateEditStep(props.activityType)}
            </div> :
            <div className={styles.tabs}>
                <Tabs activeKey={currentTab} defaultActiveKey={DEFAULT_TAB} onTabClick={handleTabChange} animated={false} tabBarGutter={10}>
                    <TabPane tab="Basic" key="1" disabled={!isValid && currentTab !== '1'}>
                        {getCreateEditStep(props.activityType)}
                    </TabPane>
                    <TabPane tab="Advanced" key="2"  disabled={!isValid && currentTab !== '2'}>
                        <AdvancedSettingsDialog
                            tabKey='2'
                            tooltipsData={props.tooltipsData}
                            openStepSettings={props.openStepSettings}
                            setOpenStepSettings={props.setOpenStepSettings}
                            stepData={props.stepData}
                            updateLoadArtifact={props.updateStep}
                            activityType={props.activityType}
                            canWrite={props.canWrite}
                            currentTab={currentTab}
                            setIsValid={setIsValid}
                            resetTabs={resetTabs}
                            setHasChanged={setHasChanged}
                        />
                    </TabPane>
                </Tabs>
            </div> }
            {discardChanges}
        </div>
    </Modal>;
}

export default Steps;
  