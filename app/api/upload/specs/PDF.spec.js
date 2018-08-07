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
        expect(text[1]).toBe('Page[[1]] 1[[1]]');
        expect(text[2]).toBe('Page[[2]] 2[[2]]');
        expect(text[3]).toBe('Page[[3]] 3[[3]]');
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
      pdf.convert()
      .then((conversion) => {
        expect(conversion.fullText[1]).toBe('Page[[1]] 1[[1]]');
        done();
      })
      .catch(done.fail);
    });

    describe('when there is a conversion error', () => {
      it('should throw a conversion_error', (done) => {
        spyOn(pdf, 'extractText').and.returnValue(Promise.reject());
        pdf.convert()
        .then(() => {
          done.fail('should have thrown a conversion_error');
        })
        .catch((error) => {
          expect(error).toEqual({ error: 'conversion_error' });
          done();
        });
      });
    });
  });
});
