import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

var AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('TodosAccess')

export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE
    ) {}

    // GET ALL TODOS
    async getAllTodos(userId: string): Promise<TodoItem[]> {
        logger.info('Get all todos initiate')
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()
        const items = result.Items
        logger.info('Get all todos successfully')
        return items as TodoItem[]
    }

    // CREATE TODO ITEM
    async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
        logger.info('Create todo item access initiate')
        const todoCreated = await this.docClient.put({
            TableName: this.todosTable,
            Item: todoItem
        }).promise()
        logger.info('Todo item created: ', todoCreated)
        return todoItem
    }

    // UPDATE TODO ITEM
    async updateTodoItem(todoId: string, userId: string, todoUpdate: TodoUpdate): Promise<TodoUpdate> {
        logger.info('Update todo item access initiate')
        const todoUpdated = await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            }, 
            UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeValues: {
                ':name': todoUpdate.name,
                ':dueDate': todoUpdate.dueDate,
                ':done': todoUpdate.done,
            },
            ExpressionAttributeNames: {
                '#name': 'name'
            },
            ReturnValues: 'ALL_NEW'
        }).promise()
        const todoItemUpdate = todoUpdated.Attributes
        logger.info('Todo item updated', todoId)
        return todoItemUpdate as TodoUpdate
    }

    // UPDATE TODO ATTACHMENT URL
    async updateTodoAttachmentUrl(todoId: string, userId: string, attachmentUrl: string): Promise<void> {
        logger.info('Update todo attachment url access initiate')
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            }, 
            UpdateExpression: 'set attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues: {
                ':attachmentUrl': attachmentUrl
            }
        }).promise()
        logger.info('Todo attachment url updated: ', todoId)
    }

    //DELETE TODO
    async deleteTodoItem(todoId: string, userId: string): Promise<string> {
        logger.info('Delete todo access initiate')
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            }
        }).promise()
        logger.info('Todo item deleted: ', todoId)
        return todoId as string
    }
}