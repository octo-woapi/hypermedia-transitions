const transitions = require('./transitions')
const propertiesHandler = require('./properties_handler')

module.exports = {
  addTransition: transitions.addTransition,
  getTransitionList: transitions.getTransitionList,
  getAvailableTransitions: transitions.getAvailableTransitions,
  clearTransitionList: transitions.clearTransitionList,
  getTemplateParams: propertiesHandler.getTemplateParams,
  fillTemplateWithParams: propertiesHandler.fillTemplateWithParams,
  isForEachItem: propertiesHandler.isForEachItem,
  isSelfRel: propertiesHandler.isSelfRel
}
