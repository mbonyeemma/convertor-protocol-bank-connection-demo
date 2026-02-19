"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankTransaction = void 0;
const typeorm_1 = require("typeorm");
let BankTransaction = class BankTransaction {
    id;
    referenceId;
    type;
    accountId;
    amount;
    currency;
    payload;
    createdAt;
};
exports.BankTransaction = BankTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BankTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 64 }),
    __metadata("design:type", String)
], BankTransaction.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32 }),
    __metadata("design:type", String)
], BankTransaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], BankTransaction.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], BankTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 3, nullable: true }),
    __metadata("design:type", Object)
], BankTransaction.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], BankTransaction.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BankTransaction.prototype, "createdAt", void 0);
exports.BankTransaction = BankTransaction = __decorate([
    (0, typeorm_1.Entity)('bank_transactions'),
    (0, typeorm_1.Index)(['referenceId'])
], BankTransaction);
//# sourceMappingURL=Transaction.js.map