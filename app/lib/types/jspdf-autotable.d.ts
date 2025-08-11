declare module 'jspdf-autotable' {
    import { jsPDF } from 'jspdf';
  
    interface AutoTableOptions {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      head?: any[][];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body?: any[][];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    }
  
    interface jsPDFWithAutoTable extends jsPDF {
      autoTable: (options: AutoTableOptions) => jsPDF;
    }
  
    export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  }
