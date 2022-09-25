declare module 'generate-json-webpack-plugin' {
  import { Compiler } from "webpack";

  export default class GenerateJsonWebpackPlugin {
    constructor( fileName: string, value: object, replacer?: ( ( key: string, value: unknown ) => unknown ) | null, space?: string | number | null );
    apply(compiler: Compiler): void;
  }

}
