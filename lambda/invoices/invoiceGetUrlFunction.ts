import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { ApiGatewayManagementApi, DynamoDB, S3 } from "aws-sdk"
import * as AWSXRay from "aws-xray-sdk"
import { v4 as uuid } from "uuid"
import { InvoiceTransactionStatus, InvoiceTransactionRepository } from "/opt/nodejs/invoiceTransaction"

AWSXRay.captureAWS(require("aws-sdk"))

const invoiceDdb = process.env.INVOICES_DDB!
const bucketName = process.env.BUCKET_NAME!
const invoicesWsApiEndpoint = process.env.INVOICE_WSAPI_ENDPOINT!.substring(6)

const s3Client = new S3()
const ddbClient = new DynamoDB.DocumentClient()
const apigwManagementApi = new ApiGatewayManagementApi({
    endpoint: invoicesWsApiEndpoint
})

const invoiceTransactionRepository = new InvoiceTransactionRepository(ddbClient, invoiceDdb)
export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult>{
    console.log(event)
    console.log(`Lambda requestId: ${context.awsRequestId}`)

    const lambadaRequestId = context.awsRequestId
    const connectionId = event.requestContext.connectionId!

    console.log(`ConnectionId: ${connectionId} - LambdaRequestId: ${lambadaRequestId}`)
    const key = uuid()
    const expires = 300
    const signedUrlPut = await s3Client.getSignedUrlPromise("putObject",{
        Bucket: bucketName,
        Key: key,
        Expires: expires,
    })

    // Create invoice transaction

    const timestamp = Date.now()
    const ttl = ~~( timestamp / 1000 * 60 * 2 )
    await invoiceTransactionRepository.createInvoiceTransaction({
        pk: "#transaction",
        sk: key,
        ttl: ttl,
        requestId: lambadaRequestId,
        transactionStatus: InvoiceTransactionStatus.GENERATED,
        timestamp: timestamp,
        expiresIn: expires,
        connectionId: connectionId,
        endpoint: invoicesWsApiEndpoint
    })
    // Send URL back to WS connected client


    return {
        statusCode: 200,
        body: "OK"
    }
}