import pdfUtils from 'api/pdfUtils';
import { attachmentsPath } from 'api/config/paths';

import PDFObject from '../PDF.js';

describe('PDF', () => {
  let pdf;

  describe('extractText', () => {
    const filepath = `${__dirname}/12345.test.pdf`;
    beforeEach(() => {
      pdf = new PDFObject(filepath);
    });

    it('should extract the text of the pdf by page, every word on every page should have appended the page number in between [[]]', (done) => {
      pdf.extractText()
      .then((text) => {
        const lines = text.split(/\f/);
        expect(lines[0]).toBe('Page[[1]] 1[[1]]');
        expect(lines[1]).toBe('Page[[2]] 2[[2]]');
        expect(lines[2]).toBe('Page[[3]] 3[[3]]');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('convert', () => {
    const filepath = `${__dirname}/12345.test.pdf`;
    beforeEach(() => {
      pdf = new PDFObject(filepath);
    });

    it('should optimize and extract html and text', (done) => {
      spyOn(pdfUtils, 'pdfPageToImage').and.returnValue(Promise.resolve());
      pdf.convert()
      .then((conversion) => {
        const lines = conversion.fullText.split(/\f/);
        expect(lines[0]).toBe('Page[[1]] 1[[1]]');
        done();
      })
      .catch(done.fail);
    });

    it('should create a thumbnail image of page 1', (done) => {
      spyOn(pdfUtils, 'pdfPageToImage').and.returnValue(Promise.resolve());
      pdf.convert()
      .then(() => {
        const thumbnailPath = `${attachmentsPath}12345.test.jpg`;
        expect(pdfUtils.pdfPageToImage).toHaveBeenCalledWith(filepath, thumbnailPath, { format: 'jpg', scale: 0.3 });
        done();
      })
      .catch(done.fail);
    });

    describe('Errors', () => {
      it('should throw a conversion_error', (done) => {
        spyOn(pdf, 'extractText').and.returnValue(Promise.reject(new Error('generic_error')));
        pdf.convert()
        .then(() => {
          done.fail('Should have thrown a conversion_error');
        })
        .catch((error) => {
          expect(error.message).toBe('conversion_error');
          done();
        });
      });

      it('should bypass a thumbnail_error (PDF.js is prone to errors, better to not block a cosmetic failure like thumbnail)', (done) => {
        spyOn(pdf, 'extractText').and.returnValue(Promise.resolve('fullText'));
        spyOn(pdfUtils, 'pdfPageToImage').and.returnValue(Promise.reject(new Error('thumbnail_error')));
        pdf.convert()
        .then((fullText) => {
          expect(fullText).toEqual({ fullText: 'fullText' });
          done();
        })
        .catch((error) => {
          done.fail(`Should not have failed with ${error}`);
        });
      });
    });
  });
});
