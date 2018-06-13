import { Field, Form, actions as formActions } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { saveSettings } from '../actions/settingsActions';
// import { actions } from 'app/BasicReducer';

import { t } from 'app/I18N';

export class Customisation extends Component {
  componentDidMount() {
    this.props.loadForm('settings', this.props.settings.toJS());
  }

  handleSubmit(data) {
    this.props.saveSettings(data);
  }

  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Customisation')}</div>
        <div className="panel-body" />
        <Form model="settings.settings" onSubmit={this.handleSubmit.bind(this)}>
          <div className="form-group">
            <label className="form-group-label" htmlFor="collection_name">{t('System', 'Custom CSS')}</label>
            <Field model=".customCSS">
              <textarea className="form-control" rows="30" />
            </Field>
            <button type="submit" className="btn btn-success">{t('System', 'Update')}</button>
          </div>
        </Form>
      </div>
    );
  }
}

Customisation.propTypes = {
  loadForm: PropTypes.func.isRequired,
  settings: PropTypes.instanceOf(Immutable.Map).isRequired,
  saveSettings: PropTypes.func.isRequired
};

const mapStateToProps = state => ({ settings: state.settings.collection });
const mapDispatchToProps = dispatch => bindActionCreators({
  loadForm: formActions.load,
  saveSettings }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Customisation);
