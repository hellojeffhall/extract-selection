const textToSnakeCase      = text => text.split(' ').join('_')
const textToLowerSnakeCase = text => text.split(' ').join('_').toLowerCase()
const textToUpperSnakeCase = text => text.split(' ').join('_').toUpperCase()

const textToKebabCase      = text => text.split(' ').join('-')
const textToLowerKebabCase = text => text.split(' ').join('-').toLowerCase()
const textToUpperKebabCase = text => text.split(' ').join('-').toUpperCase()

const textToLowerCamelCase = text => text.split(' ').map( (x, idx) => ( idx === 0 ? x[0].toLowerCase() : x[0].toUpperCase() ) + x.slice(1) ).join('')
const textToUpperCamelCase = text => text.split(' ').map( x => x[0].toUpperCase() + x.slice(1) ).join('')

const caseToFunctionDictionary = {
  asIsSnake  : textToSnakeCase,
  lowerSnake : textToLowerSnakeCase,
  upperSnake : textToUpperSnakeCase,
  asIsKebab  : textToKebabCase,
  lowerKebab : textToLowerKebabCase,
  upperKebab : textToUpperKebabCase,
  lowerCamel : textToLowerCamelCase,
  upperCamel : textToUpperCamelCase,
}

module.exports = {
  textToSnakeCase,
  textToLowerSnakeCase,
  textToUpperSnakeCase,
  textToKebabCase,
  textToLowerKebabCase,
  textToUpperKebabCase,
  textToLowerCamelCase,
  textToUpperCamelCase,
  caseToFunctionDictionary,
}
