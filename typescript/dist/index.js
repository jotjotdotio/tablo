var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./parse", "./serializers"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setSerializer = exports.serialize = exports.parse = void 0;
    const Parse = __importStar(require("./parse"));
    const serializers_1 = require("./serializers");
    let defaultSerializer = new serializers_1.TabloSerializer();
    const parse = (input) => {
        const [_ignore, data, error] = Parse.document(input, 0);
        if (error) {
            throw error;
        }
        else {
            return data;
        }
    };
    exports.parse = parse;
    const serialize = (table) => {
        return defaultSerializer.serialize(table);
    };
    exports.serialize = serialize;
    const setSerializer = (serializer) => {
        defaultSerializer = new serializer();
    };
    exports.setSerializer = setSerializer;
});
