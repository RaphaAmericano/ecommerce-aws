import { DocumentClient } from "aws-sdk/clients/dynamodb";

export enum InvoiceTransactionStatus {
    GENERATED = "URL_GENERATED",
    RECEIVED = "INVOICE_RECEIVED",
    PROCESSED = "INVOICE_PROCESSED",
    TIMEOUT = "TIMEOUT",
    CANCELLED = "INVOICE_CANCELLED",
    NON_VALID_INVOICE_NUMBER = "NON_VALID_INVOICE_NUMBER"
}
export interface InvoiceTransaction {
    pk: string;
    sk: string;
    ttl: number;
    requestId: string;
    timestamp: number;
    expiresIn: number;
    connectionId: string;
    endpoint: string;
    transactionStatus: InvoiceTransactionStatus;
}

export class InvoiceTransactionRepository {
    private ddbClient: DocumentClient;
    private invoiceTransaction: string;

    constructor(ddbClient: DocumentClient, invoiceTransaction: string){
        this.ddbClient = ddbClient;
        this.invoiceTransaction = invoiceTransaction;
    }

    async createInvoiceTransaction(invoiceTransaction: InvoiceTransaction): Promise<InvoiceTransaction>{
        await this.ddbClient.put({
            TableName: this.invoiceTransaction,
            Item: invoiceTransaction
        }).promise()
        return invoiceTransaction
    }

}