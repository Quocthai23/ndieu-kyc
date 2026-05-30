// src/index.ts
import * as ortNode from "onnxruntime-node";
import {
  DocumentExtractor as CoreDocumentExtractor,
  FaceMatcher as CoreFaceMatcher,
  LivenessDetector as CoreLivenessDetector
} from "@ndieu/kyc-core";
export * from "@ndieu/kyc-core";
var DocumentExtractor = class extends CoreDocumentExtractor {
  constructor(config = {}) {
    super({ ort: ortNode, ...config });
  }
};
var FaceMatcher = class extends CoreFaceMatcher {
  constructor(config = {}) {
    super({ ort: ortNode, ...config });
  }
};
var LivenessDetector = class extends CoreLivenessDetector {
  constructor(config = {}) {
    super({ ort: ortNode, ...config });
  }
};
export {
  DocumentExtractor,
  FaceMatcher,
  LivenessDetector
};
//# sourceMappingURL=index.mjs.map