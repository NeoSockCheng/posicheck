declare module 'dicom-parser' {
    export interface DataSet {
        elements: { [key: string]: Element };
        byteArray: Uint8Array;
        uint16(tag: string, index?: number): number | undefined;
        int16(tag: string, index?: number): number | undefined;
        uint32(tag: string, index?: number): number | undefined;
        int32(tag: string, index?: number): number | undefined;
        float(tag: string, index?: number): number | undefined;
        double(tag: string, index?: number): number | undefined;
        string(tag: string, index?: number): string | undefined;
        text(tag: string, index?: number): string | undefined;
        floatString(tag: string, index?: number): number | undefined;
        intString(tag: string, index?: number): number | undefined;
    }

    export interface Element {
        tag: string;
        vr?: string;
        length: number;
        dataOffset: number;
        items?: DataSet[];
        fragments?: Fragment[];
        encapsulatedPixelData?: boolean;
        basicOffsetTable?: number[];
        hadUndefinedLength?: boolean;
    }

    export interface Fragment {
        offset: number;
        position: number;
        length: number;
    }

    export function parseDicom(byteArray: Uint8Array, options?: ParseOptions): DataSet;

    export interface ParseOptions {
        TransferSyntaxUID?: string;
        untilTag?: string;
        vrCallback?: (tag: string) => string;
    }
}
