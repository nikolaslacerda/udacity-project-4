import { TodosAccess } from '../dataLayer/todosAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import { TodoUpdate } from '../models/TodoUpdate';

const logger = createLogger('TodosAccess')
const attachmentUtils = new AttachmentUtils()
const todosAccess = new TodosAccess()

export async function createTodo(newTodo: CreateTodoRequest,userId: string): Promise<TodoItem> {
    logger.info('Create todo called for user', userId)
    const todoId = uuid.v4()
    const createdAt = new Date().toISOString()
    const s3AttachmentUrl = attachmentUtils.getAttachmentUrl(todoId)
    const newItem = {
        userId,
        todoId,
        createdAt,
        done: false,
        attachmentUrl: s3AttachmentUrl,
        ...newTodo
    }
    return await todosAccess.createTodoItem(newItem)
}

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info('Get user todos called for user', userId)
    return await todosAccess.getAllTodos(userId)
}

export async function updateTodo(userId: string,todoId: string,todoUpdate: UpdateTodoRequest): Promise<TodoUpdate> {
    logger.info('Update todo called for user', userId)
    return todosAccess.updateTodoItem(todoId, userId, todoUpdate)
}

export async function deleteTodo(userId: string, todoId: string): Promise<string> {
    logger.info('Delete todo called for user', userId)
    return todosAccess.deleteTodoItem(todoId, userId)
}

export async function createAttachmentPresignedUrl(userId: string, todoId: string): Promise<string> {
    logger.info('Create presigned URL function called for user', userId)
    return attachmentUtils.getUploadUrl(todoId)
}