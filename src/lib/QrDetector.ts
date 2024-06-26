import jsQR from 'jsqr-es6';

import type {
  BarcodeDetector,
  BarcodeDetectorOptions,
  BarcodeFormat,
  DetectedBarcode,
} from './BarcodeDetector';
import {
  blobToImageData,
  canvasImageSourceToImageData,
  testQrCode,
} from './utils';


export class realTimeAgent{

    static _agentInstance =  {
      modelName: 'qrAgent',
      modelPath : './qrAgent.iso',
      version : '0.1',
    }

    static agentMethods = {
      status: (execute: boolean) => execute,
      tokens: (tokens: number) => tokens,
      spawn: (active: boolean )=> active,
    }

    static _worker  = {
      child: 0,
      workers:  1,
      spawn: false,
      history: [],
    }

    constructor(
        agentInstance: any,
        worker: any
    ){
        realTimeAgent._agentInstance = agentInstance;
        realTimeAgent._worker = worker;
    }
}

export default class QrDetector implements BarcodeDetector {
  _nativeDetectorSupported: boolean | undefined = undefined;
  barcodeDetector: BarcodeDetector | undefined = undefined;

  constructor(barcodeDetectorOptions?: BarcodeDetectorOptions) {
    if ((self as any).BarcodeDetector) {
      this.barcodeDetector = new (self as any).BarcodeDetector(
        barcodeDetectorOptions,
      );
    }
  }

  async detect(image: ImageBitmapSource): Promise<DetectedBarcode[]|any> {
    if (
      this._nativeDetectorSupported === true ||
      (this._nativeDetectorSupported === undefined &&
        (await this.nativeDetectorSupported()))
    ) {
      return this.barcodeDetector?.detect(image);
    }

    // Fall back to jsQR
    if (image instanceof ImageData) {
    } else if (image instanceof Blob) {
      image = await blobToImageData(image);
    } else {
      image = canvasImageSourceToImageData(image);
    }
    if (!(image instanceof ImageData)) {
      throw Error('The image is not provided in a supported format.');
    }

    const result = jsQR(image.data, image.width, image.height);
    if (!result || result.data === '') {
      return [];
    }

    const minX = Math.min(
      result.location.topLeftCorner.x,
      result.location.topRightCorner.x,
      result.location.bottomRightCorner.x,
      result.location.bottomLeftCorner.x,
    );
    const minY = Math.min(
      result.location.topLeftCorner.y,
      result.location.topRightCorner.y,
      result.location.bottomRightCorner.y,
      result.location.bottomLeftCorner.y,
    );
    const maxX = Math.max(
      result.location.topLeftCorner.x,
      result.location.topRightCorner.x,
      result.location.bottomRightCorner.x,
      result.location.bottomLeftCorner.x,
    );
    const maxY = Math.max(
      result.location.topLeftCorner.y,
      result.location.topRightCorner.y,
      result.location.bottomRightCorner.y,
      result.location.bottomLeftCorner.y,
    );

    return [
      {
        format: 'qr_code',
        rawValue: result.data,
        boundingBox: new DOMRectReadOnly(minX, minY, maxX - minX, maxY - minY),
        cornerPoints: [
          result.location.topLeftCorner,
          result.location.topRightCorner,
          result.location.bottomRightCorner,
          result.location.bottomLeftCorner,
        ],
      },
    ];
  }

  static async getSupportedFormats(): Promise<BarcodeFormat[]> {
    return ['qr_code'];
  }

  async nativeDetectorSupported(): Promise<boolean> {
    if (this._nativeDetectorSupported === undefined) {
      if ((self as any).BarcodeDetector) {
        const supportedFormats = await (
          self as any
        ).BarcodeDetector.getSupportedFormats();
        if (supportedFormats.includes('qr_code')) {
          const testResult = await this.barcodeDetector?.detect(testQrCode());
          if (testResult?.length === 1 && testResult[0].rawValue === 'ABC') {
            this._nativeDetectorSupported = true;
            return true;
          }
        }
      }
      this._nativeDetectorSupported = false;
    }
    return this._nativeDetectorSupported;
  }
}