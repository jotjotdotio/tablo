import {install} from 'jasmine-check';
install();


const {gen} = (global || window as any);

export const genStringEscapes = gen.array(gen.oneOf([
    '\n', '\t', '\r', '\b', '\\', '"'
])).then(a => a.join(''));

export const genNull = gen.return('-');
export const genBool = gen.oneOf(['true', 'false']);

const genSign = gen.oneOf(['+', '-', '']);
const genPosIntStr = gen.oneOf([
    gen.posInt.then(n => n.toString(10)),
    gen.posInt.then(n => n.toString(10).match(/\d{1,3}/g).join('_')),
    gen.posInt.then(n => n.toString(10).match(/\d{1,4}/g).join('_')),
]);
const genPosHexStr = gen.oneOf([
    gen.posInt.then(n => n.toString(16)),
    gen.posInt.then(n => n.toString(16).match(/[\dA-Fa-f]{1,3}/g).join('_')),
    gen.posInt.then(n => n.toString(16).match(/[\dA-Fa-f]{1,4}/g).join('_')),
]);

export const genInt = gen.array([genSign, genPosIntStr])
    .then(a => a.join(''));

export const genHex = gen.array([genSign, genPosHexStr])
    .then(a => a.join('0x'));

export const genFloat = gen.oneOf([
    gen.array([genSign, genPosIntStr, '.', genPosIntStr]),
    gen.array([genSign, genPosIntStr, '.']),
    gen.array([genSign, '.', genPosIntStr])
]).then(a => a.join(''));

export const genScientific = gen.array([
    genFloat, gen.oneOf(['e', 'E']), genSign, genPosIntStr
]).then(a => a.join(''));
