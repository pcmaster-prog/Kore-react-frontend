declare module "dom-to-image-more" {
  interface Options {
    width?: number;
    height?: number;
    style?: Partial<CSSStyleDeclaration>;
    quality?: number;
    bgcolor?: string;
    cacheBust?: boolean;
  }
  function toPng(node: HTMLElement, options?: Options): Promise<string>;
  function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
  function toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
  function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>;
  function toSvg(node: HTMLElement, options?: Options): Promise<string>;
  export { toPng, toJpeg, toBlob, toPixelData, toSvg };
  export default { toPng, toJpeg, toBlob, toPixelData, toSvg };
}
