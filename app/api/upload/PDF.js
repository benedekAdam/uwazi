import PDFJS from 'pdfjs-dist';

import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import debugLog from 'api/log//debugLog';

const basename = (filepath = '') => {
  let finalPath = filepath;
  if (typeof filepath !== 'string') {
    finalPath = '';
  }
  return path.basename(finalPath, path.extname(finalPath));
};

export default class PDF extends EventEmitter {
  constructor(filepath, originalName) {
    super();
    this.logFile = `${__dirname}/../../../log/${basename(originalName)}.log`;
    this.filepath = filepath;
    this.optimizedPath = filepath;
  }

  extractText() {
    return new Promise((resolve, reject) => {
      debugLog.debug(`reading file ${this.filepath}`);

      fs.readFile(this.filepath, (err, data) => {
        if (err) {
          debugLog.error(`fs readFile error ${err}`);
          return reject(err);
        }

        let fileData;
        try {
          fileData = new Uint8Array(data);
        } catch (error) {
          debugLog.error(`Uint8 error ${error}`);
          return reject(error);
        }

        debugLog.debug('Sending file data to PDFJS');
        PDFJS.getDocument(fileData)
        .then((pdf) => {
          const maxPages = pdf.pdfInfo.numPages;
          const pages = [];
          for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
            debugLog.debug(`getting page ${pageNumber}`);
            pages.push(
              pdf.getPage(pageNumber)
              .then((page) => {
                debugLog.debug(`getting page text content ${pageNumber} ${maxPages}`);
                return page.getTextContent()
                .then((text) => {
                  debugLog.debug('processing page text');
                  return `${text.items.map(s => s.str).join('').replace(/(\S+)(\s?)/g, `$1[[${Number(page.pageIndex) + 1}]]$2`)}`;
                });
              }));
          }
          Promise.all(pages).then((texts) => {
            debugLog.debug('All pages processed');
            resolve(texts.reduce((splitedPages, pageText, pageIndex) => {
              return Object.assign(splitedPages, { [pageIndex + 1]: pageText });
            }, {}));
          })
          .catch((error) => {
            debugLog.error(error);
            reject(error);
          });
        })
        .catch((error) => {
          debugLog.error(error);
          reject(error);
        });
      });
    });
  }

  convert() {
    return this.extractText()
    .catch(() => Promise.reject({ error: 'conversion_error' }))
    .then(fullText => ({ fullText }));
  }
}
