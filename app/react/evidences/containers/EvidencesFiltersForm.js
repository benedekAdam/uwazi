import {Form} from 'react-redux-form';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import FormGroup from 'app/DocumentForm/components/FormGroup';

import {MultiSelect} from '../../ReactReduxForms';
import {getFilters} from '../selectors';
import {searchEvidences, retrainModel} from '../actions';

const EvidencesFiltersForm = (props) => {
  const isEvidenceFilter = props.filters.find((f) => f.get('_id') === 'isEvidence');
  const filters = props.filters.filter((f) => f.get('_id') !== 'isEvidence');
  return (
    <Form model='evidences.search' onChange={props.onChange}>
      <FormGroup>
        <ul className="search__filter is-active">
          <li>{isEvidenceFilter.get('label')}</li>
          <li className="wide">
            <MultiSelect
              model={`.filters._${isEvidenceFilter.get('_id')}.values`}
              options={isEvidenceFilter.get('values').toJS()}
              prefix={isEvidenceFilter.get('_id')}
            />
          </li>
        </ul>
      </FormGroup>
      {filters.map((filter, index) => {
        return (
          <FormGroup key={index}>
            <ul className="search__filter is-active">
              <li>{filter.get('label')}</li>
              <li className="wide">
                <MultiSelect
                  model={`.filters._${filter.get('_id')}.values`}
                  options={filter.get('values').toJS()}
                  prefix={filter.get('_id')}
                  renderActions={(option) => <button onClick={() => props.retrainModel(filter.get('_id'), option.value)}>Retrain</button>}
                />
              </li>
            </ul>
          </FormGroup>
        );
      })}
    </Form>
  );
};

EvidencesFiltersForm.propTypes = {
  filters: PropTypes.instanceOf(Immutable.List),
  onChange: PropTypes.func,
  retrainModel: PropTypes.func
};

export function mapStateToProps(state) {
  return {
    filters: getFilters(state)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onChange: searchEvidences,
    retrainModel
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EvidencesFiltersForm);