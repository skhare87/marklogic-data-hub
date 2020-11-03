import React, { useState, useEffect, useContext } from "react";
import { Form, Input, Icon, Radio, AutoComplete } from "antd";
import axios from "axios";
import styles from './create-edit-step-dialog.module.scss';
import { UserContext } from '../../../util/user-context';
import { NewMatchTooltips } from '../../../config/tooltips.config';
import { MLButton, MLTooltip } from '@marklogic/design-system'; 
import { StepType } from '../../../types/curation-types';
import ConfirmYesNo from '../../common/confirm-yes-no/confirm-yes-no';

type Props = {
  tabKey: string;
  openStepSettings: boolean;
  setOpenStepSettings: any;
  isEditing: boolean;
  stepType: StepType;
  editStepArtifactObject: any;
  targetEntityType: string;
  canReadWrite: boolean;
  canReadOnly: boolean;
  createStepArtifact: (stepArtifact: any) => void;
  currentTab: string;
  setIsValid?: any;
  resetTabs?: any;
  setHasChanged?: any;
}

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 7 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 15 },
  },
};

const srcTypeOptions = [
  { label: 'Collection', value: 'collection' },
  { label: 'Query', value: 'query' }
];

const { TextArea } = Input;

const CreateEditStepDialog: React.FC<Props>  = (props) => {

  const { handleError } = useContext(UserContext)
  const [stepName, setStepName] = useState('');
  const [description, setDescription] = useState('');

  const [collections, setCollections] = useState('');
  const [collectionOptions, setCollectionOptions] = useState(['a','b']);
  const [selectedSource, setSelectedSource] = useState('collection')
  const [srcQuery, setSrcQuery] = useState('');

  //To check submit validity
  const [isStepNameTouched, setStepNameTouched] = useState(false);
  const [isDescriptionTouched, setDescriptionTouched] = useState(false);
  const [isCollectionsTouched, setCollectionsTouched] = useState(false);
  const [isSrcQueryTouched, setSrcQueryTouched] = useState(false);
  const [isSelectedSourceTouched, setSelectedSourceTouched] = useState(false);

  const [isValid, setIsValid] = useState(false);

  const [showConfirmModal, toggleConfirmModal] = useState(false);
  const [tobeDisabled, setTobeDisabled] = useState(false);
  const [discardChangesVisible, setDiscardChangesVisible] = useState(false);
  const [saveChangesVisible, setSaveChangesVisible] = useState(false);

  const initStep = () => {
    setStepName(props.editStepArtifactObject.name);
    setDescription(props.editStepArtifactObject.description);
    setSrcQuery(props.editStepArtifactObject.sourceQuery);
    setSelectedSource(props.editStepArtifactObject.selectedSource);
    if (props.editStepArtifactObject.selectedSource === 'collection') {
      let srcCollection = props.editStepArtifactObject.sourceQuery.substring(
          props.editStepArtifactObject.sourceQuery.lastIndexOf("[") + 2,
          props.editStepArtifactObject.sourceQuery.lastIndexOf("]") - 1
      );
      setCollections(srcCollection);
    }
    resetTouchedValues();
    setIsValid(true);
    setTobeDisabled(true);
  }

  useEffect(() => {
    if (props.currentTab === props.tabKey) {
      // Edit Step Artifact
      if (props.isEditing) {
        initStep()
      } 
      // New Step Artifact
      else {
        reset();
      }
    }
  }, [props.currentTab]);

  const reset = () => {
    setStepName('');
    setDescription('');
    setSelectedSource('collection');
    setTobeDisabled(false);
    setCollections('');
    setSrcQuery('');
    resetTouchedValues();
  }

  const resetTouchedValues = () => {
    setSelectedSourceTouched(false);
    setCollectionsTouched(false);
    setSrcQueryTouched(false);
    setStepNameTouched(false);
    setDescriptionTouched(false);
  }

  useEffect(() => {
    if (props.currentTab !== props.tabKey && hasFormChanged()) {
      setSaveChangesVisible(true);
    }
  }, [props.currentTab])

  const onCancel = () => {
    if (hasFormChanged()) {
      setDiscardChangesVisible(true);
    } else {
      reset();
      props.setOpenStepSettings(false);
      props.resetTabs();
    }
  };

  const hasFormChanged = () => {
    if (!isStepNameTouched
      && !isDescriptionTouched
      && !isSelectedSourceTouched
      && !isCollectionsTouched
      && !isSrcQueryTouched
    ) {
      return false;
    } else {
      return true;
    }
  };

  const discardOk = () => {
    props.setOpenStepSettings(false);
    setDiscardChangesVisible(false);
  };

  const discardCancel = () => {
    setDiscardChangesVisible(false);
  };

  const discardChanges = <ConfirmYesNo
    visible={discardChangesVisible}
    body='Discard changes?'
    onYes={discardOk}
    onNo={discardCancel}
  />;

  const saveOk = () => {
    props.createStepArtifact(getPayload());
    setSaveChangesVisible(false)
  }

  const saveCancel = () => {
    setSaveChangesVisible(false);
    initStep();
  }

  const saveChanges = <ConfirmYesNo
    visible={saveChangesVisible}
    body='Save changes?'
    onYes={saveOk}
    onNo={saveCancel}
  />;

  const confirmAction = () => {
    toggleConfirmModal(false);
    props.setOpenStepSettings(false);
    props.resetTabs();
  };

  const getPayload = () => {
    let result;
    if(selectedSource === 'collection') {
      let sQuery = `cts.collectionQuery(['${collections}'])`;
      result = {
        name: stepName,
        targetEntityType: props.targetEntityType,
        description: description,
        selectedSource: selectedSource,
        sourceQuery: sQuery
      };
    } else {
      result = {
        name: stepName,
        targetEntityType: props.targetEntityType,
        description: description,
        selectedSource: selectedSource,
        sourceQuery: srcQuery
      };
    }
    return result;
  }

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    if (event) event.preventDefault();

    setIsValid(true);

    props.createStepArtifact(getPayload());
    props.setOpenStepSettings(false);
    props.resetTabs();
  };

  const handleSearch = async (value: any) => {
    if(value && value.length > 2){
      try {
        let data = {
            "referenceType": "collection",
            "entityTypeId": " ",
            "propertyPath": " ",
            "limit": 10,
            "dataType": "string",
            "pattern": value,
        }
        const response = await axios.post(`/api/entitySearch/facet-values?database=staging`, data)
        setCollectionOptions(response.data);
      } catch (error) {
        console.log(error)
        handleError(error);
    }

    }else{
      setCollectionOptions([]);
    }
  }

  const handleFocus = () => {
      setCollectionOptions([]);
  }

  const handleTypeaheadChange = (data: any) => {
    if (data === ' ') {
        setCollectionsTouched(false);
    }
    else {
      setCollectionsTouched(true);
      setCollections(data);
      if (props.isEditing && props.editStepArtifactObject.collection) {
        if (props.editStepArtifactObject.collection === data) {
          setCollectionsTouched(false);
        }
      }
      if (data.length > 0) {
        if (stepName) {
         setIsValid(true);
        }
      } else {
        setIsValid(false);
      }
    }
  }

  const handleChange = (event) => {
    if (event.target.id === 'name') {
      if (event.target.value === ' ') {
        setStepNameTouched(false);
      }
      else {
        setStepNameTouched(true);
        setStepName(event.target.value);
        if (event.target.value.length > 0) {
          if (JSON.stringify(collections) !== JSON.stringify([]) || srcQuery) {
            setIsValid(true);
          }
        } else {
          setIsValid(false);
        }
      }
    }

    if (event.target.id === 'description') {
      if (event.target.value === ' ') {
        setDescriptionTouched(false);
      }
      else {
        setDescriptionTouched(true);
        setDescription(event.target.value);
        if (props.isEditing && props.editStepArtifactObject.description) {
          if (event.target.value === props.editStepArtifactObject.description) {
            setDescriptionTouched(false);
          }
        }
      }
    }

    if (event.target.id === 'srcQuery') {
      if (event.target.value === ' ') {
        setSrcQueryTouched(false);
      }
      else {
        setSrcQueryTouched(true);
        setSrcQuery(event.target.value);
        if (event.target.value.length > 0) {
          if (stepName) {
            setIsValid(true);
          }
        } else {
          setIsValid(false);
        }
      }
    }
    if (event.target.id === 'collList') {
      if (event.target.value === ' ') {
        setCollectionsTouched(false);
      }
      else {
        setCollectionsTouched(true);
        setCollections(event.target.value);
        if (props.isEditing && props.editStepArtifactObject.collection) {
          if (props.editStepArtifactObject.collection === event.target.value) {
            setCollectionsTouched(false);
          }
        }
        if (event.target.value.length > 0) {
          if (stepName) {
            setIsValid(true);
          }
        } else {
          setIsValid(false);
        }
      }
    }

    props.setHasChanged(hasFormChanged()); // changed flag for parent

  };

  const handleSelectedSource = (event) => {
    if (event.target.value === ' ') {
      setSelectedSourceTouched(false);
    }
    else {
      setSelectedSourceTouched(true);
      setSelectedSource(event.target.value);
      if (props.isEditing && event.target.value === props.editStepArtifactObject.selectedSource) {
        setSelectedSourceTouched(false);
      }
      if (event.target.value === 'collection') {
        if (stepName && JSON.stringify(collections) !== JSON.stringify([])) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } else {
        if (stepName && srcQuery) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      }
    }
  };

  return (
      <div className={styles.newMatchingForm}>
        <Form {...formItemLayout} onSubmit={handleSubmit} colon={false}>
          <Form.Item label={<span>
            Name:&nbsp;<span className={styles.asterisk}>*</span>
            &nbsp;
              </span>} labelAlign="left"
            validateStatus={(stepName || !isStepNameTouched) ? '' : 'error'}
            help={(stepName || !isStepNameTouched) ? '' : 'Name is required'}
          >
            <Input
              id="name"
              placeholder="Enter name"
              value={stepName}
              onChange={handleChange}
              disabled={tobeDisabled}
              className={styles.input}
            />&nbsp;&nbsp;
            <MLTooltip title={NewMatchTooltips.name}>
          <Icon type="question-circle" className={styles.questionCircle} theme="filled" />
        </MLTooltip>
          </Form.Item>
          <Form.Item label={<span>
            Description:
            &nbsp;
              </span>} labelAlign="left">
            <Input
              id="description"
              placeholder="Enter description"
              value={description}
              onChange={handleChange}
              disabled={props.canReadOnly && !props.canReadWrite}
              className={styles.input}
            />&nbsp;&nbsp;
            <MLTooltip title={NewMatchTooltips.description}>
          <Icon type="question-circle" className={styles.questionCircle} theme="filled" />
        </MLTooltip>
          </Form.Item>

          <Form.Item label={<span>
            Source Query:&nbsp;<span className={styles.asterisk}>*</span>
            &nbsp;
              </span>} labelAlign="left">
            <Radio.Group
              id="srcType"
              options={srcTypeOptions}
              onChange={handleSelectedSource}
              value={selectedSource}
              disabled={!props.canReadWrite}
            >
            </Radio.Group>
            {selectedSource === 'collection' ? <div ><span className={styles.srcCollectionInput}><AutoComplete
              id="collList"
              //mode="tags"
              className={styles.input}
              dataSource={collectionOptions}
              aria-label="collection-input"
              placeholder= {<span>Enter collection name<Icon className={styles.searchIcon} type="search" theme="outlined"/></span>}
              value={collections}
              disabled={!props.canReadWrite}
              onSearch={handleSearch}
              onFocus= {handleFocus}
              onChange={handleTypeaheadChange}
            >
              {/* {collectionsList} */}
            </AutoComplete>&nbsp;&nbsp;{props.canReadWrite ? <Icon className={styles.searchIcon} type="search" theme="outlined"/> : ''}<MLTooltip title={NewMatchTooltips.sourceQuery}>
              <Icon type="question-circle" className={styles.questionCircleColl} theme="filled" />
            </MLTooltip></span></div> : <span><TextArea
              id="srcQuery"
              placeholder="Enter source query"
              value={srcQuery}
              onChange={handleChange}
              disabled={!props.canReadWrite}
              className={styles.input}
            ></TextArea>&nbsp;&nbsp;<MLTooltip title={NewMatchTooltips.sourceQuery}>
            <Icon type="question-circle" className={styles.questionCircleTextArea} theme="filled" />
          </MLTooltip></span>}
          </Form.Item>

          <Form.Item className={styles.submitButtonsForm}>
            <div className={styles.submitButtons}>
              <MLButton onClick={() => onCancel()}>Cancel</MLButton>
              &nbsp;&nbsp;
              <MLButton type="primary" htmlType="submit" disabled={!isValid || !props.canReadWrite} onClick={handleSubmit}>Save</MLButton>
            </div>
          </Form.Item>
        </Form>
        {discardChanges}
        {saveChanges}
      </div>
  );
};

export default CreateEditStepDialog;