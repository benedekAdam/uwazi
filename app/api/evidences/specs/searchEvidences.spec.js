/* eslint-disable max-nested-callbacks */
import {catchErrors} from 'api/utils/jasmineHelpers';
import {index as elasticIndex} from 'api/config/elasticIndexes';
import db from 'api/utils/testing_db';
import elasticTesting from 'api/utils/elastic_testing';

import elastic from '../../search/elastic';
import fixtures, {
  evidenceId,
  propertyID1,
  value1,
  value2
} from './fixtures';
import search from '../searchEvidences.js';

describe('searchEvidences', () => {
  beforeAll((done) => {
    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }

      elasticTesting.reindexEvidences()
      .then(done)
      .catch(done.fail);
    });
  });

  describe('search', () => {
    it('should return all results if no params passed', (done) => {
      search.search()
      .then((allEvidences) => {
        expect(allEvidences.totalRows).toBe(7);
        expect(allEvidences.rows.length).toBe(7);
        const value1Evidence = allEvidences.rows.find((e) => e._id === evidenceId.toString());
        expect(value1Evidence.value).toBe(value1);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter by probability', (done) => {
      Promise.all([
        search.search({probability: {values: ['0.5-0.6']}}),
        search.search({probability: {values: ['0.9-1']}}),
        search.search({probability: {values: ['0.9-1', '0.5-0.6']}}),
        search.search({[propertyID1.toString()]: {values: [value1]}, probability: {values: ['0.8-0.9']}})
      ])
      .then(([range5060, range90100, multipleRanges, range8090WithSearch]) => {
        expect(range5060.totalRows).toBe(2);
        expect(range5060.rows.length).toBe(2);
        expect(range5060.rows.find((e) => e.probability === 0.55)).toBeDefined();
        expect(range5060.rows.find((e) => e.probability === 0.59)).toBeDefined();

        expect(range90100.totalRows).toBe(3);
        expect(range90100.rows.length).toBe(3);
        expect(range90100.rows.find((e) => e.probability === 0.90)).toBeDefined();
        expect(range90100.rows.find((e) => e.probability === 0.91)).toBeDefined();
        expect(range90100.rows.find((e) => e.probability === 0.99)).toBeDefined();

        expect(multipleRanges.totalRows).toBe(5);
        expect(multipleRanges.rows.length).toBe(5);
        expect(multipleRanges.rows.find((e) => e.probability === 0.90)).toBeDefined();
        expect(multipleRanges.rows.find((e) => e.probability === 0.59)).toBeDefined();

        expect(range8090WithSearch.totalRows).toBe(1);
        expect(range8090WithSearch.rows.length).toBe(1);
        expect(range8090WithSearch.rows.find((e) => e.probability === 0.81)).toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });

    it('should search by value', (done) => {
      const query1 = {};
      query1[propertyID1.toString()] = {values: [value1]};
      const query2 = {};
      query2[propertyID1.toString()] = {values: [value2]};
      const query3 = {};
      query3[propertyID1.toString()] = {values: [value1, value2]};
      const query4 = {};
      query4[propertyID1.toString()] = {values: [value1]};
      query4.isEvidence = {values: [true]};
      const query5 = {};
      query5[propertyID1.toString()] = {values: [value1]};
      query5.isEvidence = {values: [false]};
      const query6 = {};
      query6[propertyID1.toString()] = {values: [value1]};
      query6.isEvidence = {values: ['null']};

      Promise.all([
        search.search(query1),
        search.search(query2),
        search.search(query3),
        search.search(query4),
        search.search(query5),
        search.search(query6)
      ])
      .then(([value1Evidences, value2Evidences, value12Evidences, value1TrueEvidence, value1FalseEvidence, onlySuggestions]) => {
        expect(value1Evidences.rows.length).toBe(3);
        expect(value1Evidences.rows[0].value).toBe(value1);
        expect(value1Evidences.rows[1].value).toBe(value1);

        expect(value2Evidences.rows.length).toBe(2);
        expect(value2Evidences.rows[0].value).toBe(value2);
        expect(value2Evidences.rows[1].value).toBe(value2);

        expect(value12Evidences.rows.length).toBe(0);

        expect(value1TrueEvidence.rows.length).toBe(1);
        expect(value1TrueEvidence.rows[0].isEvidence).toBe(true);

        expect(value1FalseEvidence.rows.length).toBe(1);
        expect(value1FalseEvidence.rows[0].isEvidence).toBe(false);

        expect(onlySuggestions.rows.length).toBe(1);
        expect(onlySuggestions.rows[0].isEvidence).not.toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('index', () => {
    it('should index the evidence, with the documentName', (done) => {
      spyOn(elastic, 'index').and.returnValue(Promise.resolve('indexResponse'));

      const id = db.id();

      const evidence = {
        _id: id,
        document: 'shared',
        language: 'en'
      };

      search.index(evidence)
      .then((indexedEvidence) => {
        expect(indexedEvidence).toEqual({_id: id, document: 'shared', documentTitle: 'Suggestions doc', language: 'en'});
        expect(evidence._id.toString()).toBe(id.toString());
        expect(elastic.index)
        .toHaveBeenCalledWith({
          index: elasticIndex,
          type: 'evidence',
          id: id.toString(),
          body: {
            document: 'shared',
            documentTitle: 'Suggestions doc',
            language: 'en'
          }
        });
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('delete', () => {
    it('should delete the evidence', (done) => {
      spyOn(elastic, 'delete').and.returnValue(Promise.resolve());

      const id = db.id();

      search.delete(id)
      .then(() => {
        expect(elastic.delete).toHaveBeenCalledWith({index: elasticIndex, type: 'evidence', id: id.toString()});
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('bulkIndex', () => {
    it('should update evidences using the bulk functionality and not have side effects', (done) => {
      spyOn(elastic, 'bulk').and.returnValue(Promise.resolve({items: []}));
      const evidences = [
        {_id: 'id1', document: 'shared'},
        {_id: 'id2', document: 'shared2'}
      ];

      search.bulkIndex(evidences)
      .then((evidencesIndexed) => {
        expect(elastic.bulk).toHaveBeenCalledWith({body: [
          {index: {_index: elasticIndex, _type: 'evidence', _id: 'id1'}},
          {document: 'shared', documentTitle: 'Suggestions doc'},
          {index: {_index: elasticIndex, _type: 'evidence', _id: 'id2'}},
          {document: 'shared2', documentTitle: 'doc2'}
        ]});

        expect(evidencesIndexed).toEqual([
          {_id: 'id1', document: 'shared', documentTitle: 'Suggestions doc'},
          {_id: 'id2', document: 'shared2', documentTitle: 'doc2'}
        ]);
        expect(evidences[0]._id).toBeDefined();
        expect(evidences[1]._id).toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });
  });
});