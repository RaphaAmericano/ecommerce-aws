import { CfnOutpostResolver } from "aws-cdk-lib/aws-route53resolver";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const lambdaRequestId = context.awsRequestId;
    const apiRequestId = event.requestContext.requestId

    console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)

    if(event.resource === "/products"){
        console.log("POST /products")
        return {
            statusCode: 201,
            body: "POST /products"
        }
    }
    
}