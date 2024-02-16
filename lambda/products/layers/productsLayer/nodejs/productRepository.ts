import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { v4 as uuid } from "uuid"
export interface Product {
    id: string;
    productName: string;
    code: string;
    price: number;
    model: string;
}

export class ProductRepository {
    private ddbClient: DocumentClient;
    private productsDdb: string;

    constructor(ddbClient: DocumentClient, productsDdb: string){
        this.ddbClient = ddbClient
        this.productsDdb = productsDdb
    }

    public async getAllProducts(): Promise<Product[]> {
        // TODO: Refatorar depois para igual ao codigo do outro curso
        const data = await this.ddbClient.scan({
            TableName: this.productsDdb
        }).promise()
        return data.Items as Product[]
    }

    public async getProductsById(productId: string): Promise<Product> {
        const data = await this.ddbClient.get({
            TableName: this.productsDdb,
            Key:{
                id: productId

            }
        }).promise()
        if(data.Item) {
            return data.Item as Product
        } else {
            throw new Error("Product not found")
        }
    }

    public async create(product: Product): Promise<Product>{
        product.id = uuid()
        await this.ddbClient.put({
            TableName: this.productsDdb,
            Item: product
        }).promise()
        return product
    }

}