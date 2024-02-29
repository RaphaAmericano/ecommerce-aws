import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import * as AWSXRay from "aws-xray-sdk"

AWSXRay.captureAWS(require("aws-sdk"))
export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult>{
    console.log(event)
    console.log(`Lambda requestId: ${context.awsRequestId}`)
    return {
        statusCode: 200,
        body: "OK"
    }
}