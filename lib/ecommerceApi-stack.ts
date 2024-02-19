import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs"
import * as cdk from "aws-cdk-lib"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as cwlogs from "aws-cdk-lib/aws-logs"
import { Construct } from "constructs"

interface ECommerceApiStackProps extends cdk.StackProps {
    productsFetchHandler: lambdaNodeJS.NodejsFunction;
    productsAdminHandler: lambdaNodeJS.NodejsFunction;
    ordersHandler: lambdaNodeJS.NodejsFunction;
}

export class EcommerceApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ECommerceApiStackProps ){
        super(scope, id, props)
        const logGroup = new cwlogs.LogGroup(this, "ECommerceApiLogs")
        const api = new apigateway.RestApi(this, "ECommerceApi", {
            restApiName: "ECommerceApi",
            cloudWatchRole: true,
            deployOptions: {
                accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
                accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
                    httpMethod: true,
                    ip: true,
                    protocol: true,
                    requestTime: true,
                    resourcePath: true,
                    responseLength: true,
                    status: true,
                    caller: true,
                    user: true
                })
            }
        })

        this.createProductsService(props, api)
        this.createOrdersService(props, api)
    }   

    private createOrdersService(props: ECommerceApiStackProps, api: apigateway.RestApi): void {
        const ordersIntegration = new apigateway.LambdaIntegration(props.ordersHandler)
        // info: resource - /orders

        const ordersResource = api.root.addResource("orders")
        // ? GET /orders
        // ? GET /orders?email=no-reply@email.com.br
        // ? GET /orders?email=no-reply@email.com.br&orderId=123
        ordersResource.addMethod("GET", ordersIntegration)

        
        // ? DELETE /orders?email=no-reply@email.com.br&orderId=123
        const orderDeletionValidator = new apigateway.RequestValidator(this, "OrderDeletionValidator", {
            restApi: api, 
            requestValidatorName: "OrderDeletionValidator",
            validateRequestParameters: true,
        })
        ordersResource.addMethod("DELETE", ordersIntegration, {
            requestParameters: {
                "method.request.querystring.email": true,
                "method.request.querystring.orderId": true,
            },
            requestValidator: orderDeletionValidator
        })
        // ? POST /orders
        ordersResource.addMethod("POST", ordersIntegration)


    }
    private createProductsService(props: ECommerceApiStackProps, api: apigateway.RestApi ): void {
        const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchHandler)
        // ? "/products"
        const productsResource = api.root.addResource("products")
        productsResource.addMethod("GET", productsFetchIntegration)

        // ? /products/{id}
        const productIdResource = productsResource.addResource("{id}")
        productIdResource.addMethod("GET", productsFetchIntegration)

        // info: Admin

        const productsAdminIntegration = new apigateway.LambdaIntegration(props.productsAdminHandler)

        // ? POST /products
        productsResource.addMethod("POST", productsAdminIntegration)

        // ? PUT /products/{id}
        productIdResource.addMethod("PUT", productsAdminIntegration)

        // ? DELETE /products/{id}
        productIdResource.addMethod("DELETE", productsAdminIntegration)
    }

}
