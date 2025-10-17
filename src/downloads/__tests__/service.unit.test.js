/* eslint-env jest */

const DownloadService = require('../DownloadService');
const DownloadRepository = require('../DownloadRepository');
const DownloadEntity = require('../DownloadEntity');

describe('DownloadService - Unit Tests', () => {
    let service;

    beforeEach(() => {
        // Create service instance (uses real repository)
        service = new DownloadService();
    });

    describe('Constructor', () => {
        test('initializes with DownloadRepository', () => {
            expect(service.repository).toBeInstanceOf(DownloadRepository);
        });

        test('initializes with DownloadEntity class', () => {
            expect(service.entityClass).toBe(DownloadEntity);
        });

        test('accepts custom repository', () => {
            const customRepo = new DownloadRepository({});
            const customService = new DownloadService({
                downloadsRepository: customRepo,
            });

            expect(customService.repository).toBe(customRepo);
        });

        test('accepts custom entity class', () => {
            class CustomEntity {}
            const customService = new DownloadService({
                entityClass: CustomEntity,
            });

            expect(customService.entityClass).toBe(CustomEntity);
        });
    });

    describe('Service API', () => {
        test('has getAll method', () => {
            expect(typeof service.getAll).toBe('function');
        });

        test('has getById method', () => {
            expect(typeof service.getById).toBe('function');
        });

        test('has getOne method', () => {
            expect(typeof service.getOne).toBe('function');
        });

        test('has create method', () => {
            expect(typeof service.create).toBe('function');
        });

        test('has update method', () => {
            expect(typeof service.update).toBe('function');
        });

        test('has delete method', () => {
            expect(typeof service.delete).toBe('function');
        });

        test('has upsert method', () => {
            expect(typeof service.upsert).toBe('function');
        });

        test('has exists method', () => {
            expect(typeof service.exists).toBe('function');
        });

        test('has assertExists method', () => {
            expect(typeof service.assertExists).toBe('function');
        });

        test('has paginate method', () => {
            expect(typeof service.paginate).toBe('function');
        });
    });

    describe('Inheritance', () => {
        test('extends BaseService', () => {
            const BaseService = require('../../common/BaseService');
            const proto = Object.getPrototypeOf(Object.getPrototypeOf(service));
            expect(proto.constructor).toBe(BaseService);
        });

        test('has no custom methods beyond BaseService', () => {
            // Get all methods from the prototype
            const proto = Object.getPrototypeOf(service);
            const protoMethods = Object.getOwnPropertyNames(proto)
                .filter(name => typeof service[name] === 'function' && name !== 'constructor');

            // Get all methods from BaseService
            const BaseService = require('../../common/BaseService');
            const baseProto = BaseService.prototype;
            const baseMethods = Object.getOwnPropertyNames(baseProto)
                .filter(name => typeof baseProto[name] === 'function' && name !== 'constructor');

            // Check that DownloadService has no additional methods
            const customMethods = protoMethods.filter(method => !baseMethods.includes(method));

            expect(customMethods).toEqual([]);
        });
    });

    describe('Configuration', () => {
        test('repository is properly configured', () => {
            expect(service.repository.modelName).toBe('downloads');
            expect(service.repository.entityClass).toBe(DownloadEntity);
        });

        test('service references correct entity class', () => {
            expect(service.entityClass).toBe(DownloadEntity);
        });
    });
});
