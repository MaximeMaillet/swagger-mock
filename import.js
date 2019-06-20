const data = require('./api');
const endpoints = Object.keys(data.paths);
const basePath = '/api';
let route = {[basePath]: {}};

const getPropertiesFromDefinition = (def) => {
  const model = def.replace(/^\#\/definitions\/(.+)$/, '$1');
  return data.definitions[model].properties;
};

const writeResponse = (properties, prefix) => {
  const _response = {};
  const _properties = Object.keys(properties);
  for(const i in _properties) {
    const name = _properties[i];

    if(properties[name]['$ref']) {
      _response[name] = writeResponse(getPropertiesFromDefinition(properties[name]['$ref']));
      continue;
    }

    switch(properties[name].type) {
      case 'array':
        _response[name] = properties[name].default ? properties[name].default : [];
        break;
      case 'string':
        _response[name] = properties[name].default ? properties[name].default : 'string';
        break;
      case 'integer':
        _response[name] = properties[name].default ? properties[name].default : 0;
        break;
      default:
        _response[name] = properties[name].default ? properties[name].default : 'default';
    }
  }

  if(prefix) {
    return {
      [prefix]: _response
    };
  }

  return _response;
};

const extractControllers = (endpointData, controller) => {
  Object.keys(endpointData)
    .forEach((method) => {
      let response = {};
      if(endpointData[method].responses[200]) {
        const properties = endpointData[method].responses[200].schema.allOf;

        for(const j in properties) {
          if(properties[j].properties) {
            response = Object.assign(response, writeResponse(properties[j].properties));
          } else if (properties[j]['$ref']) {
            response = Object.assign(response, writeResponse(getPropertiesFromDefinition(properties[j]['$ref'])));
          }
        }
      }

      controller[method] = (req, res) => {
        res.send(response);
      };
    });
};

const segmentUrl = (endpoint, controller) => {
  const segments = endpoint.substring(1).split('/');
  segments.reduce((acc,current, index) => {
    const segment = `/${current.replace(/^\{(.+)\}$/, ':$1')}`;
    if(!acc[segment]) {
      acc[segment] = {};
    }

    if(index === segments.length-1) {
      acc[segment] = Object.assign(acc[segment], controller);
    }

    return acc[segment];
  }, route[basePath]);
};

const _import = () => {
  for(const i in endpoints) {
    const endpointData = data.paths[endpoints[i]];
    const controller = {};
    extractControllers(endpointData, controller);
    segmentUrl(endpoints[i], controller);
  }

  return route;
};

module.exports = {
  import: _import,
};

const pprint = (obj) => {
  let str = '';
  const k = Object.keys(obj);
  for(const i in k) {
    str += `{${k[i]}: ${typeof obj[k[i]] === 'object' ? pprint(obj[k[i]]) : obj[k[i]]}}`;
  }
  return str;
};

// _import();
