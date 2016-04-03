import React from 'react';
import Viewer from '../Viewer';
import backend from 'fetch-mock';
import TestUtils from 'react-addons-test-utils';
import {APIURL} from '../../../config.js';
import API from '../../../utils/singleton_api';
import {events} from '../../../utils/index';
import MockProvider from '../../App/specs/MockProvider';

describe('Viewer', () => {
  let documentResponse = [{key: 'doc1', id: '1', value: {pages: [], css: [], template: 1, file: {}}}];
  let newDocument = [{key: 'doc2', id: '1', value: {doc: 'doc2', pages: [], css: [], template: 1, file: {}}}];
  let templateResponse = [{value: {}}];

  let component;

  beforeEach(() => {
    let params = {documentId: '1'};
    let router = {createHref: function () {}};

    TestUtils.renderIntoDocument(<MockProvider router={router}><Viewer params={params} ref={(ref) => component = ref} /></MockProvider>);
    backend.restore();
    backend
    .mock(APIURL + 'documents?_id=1', 'GET', {body: JSON.stringify({rows: documentResponse})})
    .mock(APIURL + 'documents?_id=newId', 'GET', {body: JSON.stringify({rows: newDocument})})
    .mock(APIURL + 'templates?key=1', 'GET', {body: JSON.stringify({rows: templateResponse})})
    .mock(APIURL + 'references?sourceDocument=1', 'GET', {body: JSON.stringify({rows: [{title: 1}]})})
    .mock(APIURL + 'references?sourceDocument=newId', 'GET', {body: JSON.stringify({rows: [ {value: {title: 'new'}} ]})})
    .mock(APIURL + 'references', 'POST', {body: JSON.stringify({id: 'newReferenceId'})});
  });

  describe('static requestState', () => {
    it('should request the document, the references and the template', (done) => {
      let id = 1;
      Viewer.requestState({documentId: id}, API)
      .then((response) => {
        expect(response).toEqual({value: documentResponse[0].value, references: [{title: 1}], template: templateResponse[0]});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('componentWillReceiveProps', () => {
    describe('when new documentId is sent', () => {
      it('should request the new state', (done) => {
        spyOn(component, 'setState').and.callThrough();
        component.componentWillReceiveProps({params: {documentId: 'newId'}})
        .then(() => {
          expect(component.state.value.doc).toBe('doc2');
          done();
        })
        .catch(done.fail);

        expect(component.setState).toHaveBeenCalledWith(Viewer.emptyState());
      });
    });

    describe('when documentId is the same', () => {
      it('should return false', () => {
        expect(component.componentWillReceiveProps({params: {documentId: '1'}})).toBe(false);
      });
    });
  });

  describe('saveReference', () => {
    it('should save the reference', () => {
      component.document.reference = {reference: 'reference'};

      component.document.createReference();
      expect(backend.calls().matched[0][1].body).toBe(JSON.stringify({reference: 'reference'}));
      expect(backend.calls().matched[0][0]).toBe(APIURL + 'references');
    });

    describe('on success', () => {
      it('should add the reference on the document', (done) => {
        spyOn(component.document, 'addReference');

        component.saveReference({reference: 'reference'})
        .then(() => {
          expect(component.document.addReference).toHaveBeenCalledWith({value: {_id: 'newReferenceId', reference: 'reference'}});
          done();
        })
        .catch(done.fail);
      });

      it('should close document modal', (done) => {
        spyOn(component.document, 'closeModal');

        component.saveReference({reference: 'reference'})
        .then(() => {
          expect(component.document.closeModal).toHaveBeenCalled();
          done();
        });
      });

      it('should emit a success alert', (done) => {
        let eventType;
        let eventMessage;

        events.on('alert', (type, message) => {
          eventType = type;
          eventMessage = message;
        });

        component.saveReference({})
        .then(() => {
          expect(eventType).toBe('success');
          expect(eventMessage).toBe('Reference created.');
          done();
        })
        .catch(done.fail);
      });
    });
  });
});