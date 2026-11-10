export default class EventEmitter {
  constructor() {
    this.callbacks = {}
    this.callbacks.base = {}
  }

  on(_names, callback) {
    if (typeof _names === 'undefined' || _names === '') {
      console.warn('Wrong names for EventEmitter.on')
      return false
    }

    if (typeof callback === 'undefined') {
      console.warn('Wrong callback for EventEmitter.on')
      return false
    }

    const names = this.resolveNames(_names)

    names.forEach((_name) => {
      const name = this.resolveName(_name)

      if (!(this.callbacks[name.value] instanceof Object)) {
        this.callbacks[name.value] = {}
      }

      if (!(this.callbacks[name.value][name.namespace] instanceof Array)) {
        this.callbacks[name.value][name.namespace] = []
      }

      this.callbacks[name.value][name.namespace].push(callback)
    })

    return this
  }

  off(_names) {
    if (typeof _names === 'undefined' || _names === '') {
      console.warn('Wrong names for EventEmitter.off')
      return false
    }

    const names = this.resolveNames(_names)

    names.forEach((_name) => {
      const name = this.resolveName(_name)

      if (name.namespace !== 'base' && name.value === '') {
        delete this.callbacks[name.value]
      } else {
        if (name.value === '') {
          for (const namespace in this.callbacks) {
            if (this.callbacks[namespace] instanceof Object && this.callbacks[namespace][name.namespace] instanceof Array) {
              delete this.callbacks[namespace][name.namespace]
              if (Object.keys(this.callbacks[namespace]).length === 0) {
                delete this.callbacks[namespace]
              }
            }
          }
        } else if (this.callbacks[name.value] instanceof Object && this.callbacks[name.value][name.namespace] instanceof Array) {
          delete this.callbacks[name.value][name.namespace]
          if (Object.keys(this.callbacks[name.value]).length === 0) {
            delete this.callbacks[name.value]
          }
        }
      }
    })

    return this
  }

  trigger(_name, _args) {
    if (typeof _name === 'undefined' || _name === '') {
      console.warn('Wrong name for EventEmitter.trigger')
      return false
    }

    let finalResult = null
    let result = null

    const args = !(_args instanceof Array) ? [_args] : _args
    let name = this.resolveNames(_name)
    name = this.resolveName(name[0])

    if (this.callbacks[name.value] instanceof Object) {
      if (name.namespace === 'base') {
        for (const namespace in this.callbacks[name.value]) {
          if (this.callbacks[name.value][namespace] instanceof Array) {
            this.callbacks[name.value][namespace].forEach(function (callback) {
              result = callback.apply(this, args)
              if (typeof finalResult === 'undefined') {
                finalResult = result
              }
            })
          }
        }
      } else if (this.callbacks[name.value][name.namespace] instanceof Array) {
        this.callbacks[name.value][name.namespace].forEach(function (callback) {
          result = callback.apply(this, args)
          if (typeof finalResult === 'undefined') {
            finalResult = result
          }
        })
      }
    }

    return finalResult
  }

  resolveNames(_names) {
    let names = _names
    names = names.replace(/[^a-zA-Z0-9 ,/.]/g, '')
    names = names.replace(/[,/]+/g, ' ')
    names = names.split(' ')
    return names
  }

  resolveName(name) {
    const parts = name.split('.')
    return {
      original: name,
      value: parts[0],
      namespace: parts.length > 1 && parts[1] !== '' ? parts[1] : 'base'
    }
  }
}

