const fieldLabels: Record<string, string> = {
  amount: 'monto',
  city: 'ciudad',
  creditApproved: 'aprobacion de credito',
  creditDays: 'dias de credito',
  creditLimit: 'limite de credito',
  customerId: 'cliente',
  email: 'correo',
  name: 'nombre',
  notes: 'observaciones',
  password: 'contrasena',
  paymentMethod: 'metodo de pago',
  phone: 'telefono',
  proof: 'comprobante',
  reference: 'referencia',
  status: 'estado',
}

function translateField(field: string) {
  return fieldLabels[field] ?? field
}

function sanitize(message: string) {
  return message.replace(/\s+/g, ' ').trim()
}

function translateSingleMessage(message: string) {
  const normalized = sanitize(message)

  if (!normalized) {
    return ''
  }

  const propertyShouldNotExist = normalized.match(/^property (\w+) should not exist$/i)
  if (propertyShouldNotExist) {
    return `El campo ${translateField(propertyShouldNotExist[1])} no deberia enviarse en esta operacion.`
  }

  const fieldRequired = normalized.match(/^(\w+) should not be empty$/i)
  if (fieldRequired) {
    return `El campo ${translateField(fieldRequired[1])} es obligatorio.`
  }

  if (/must be an email/i.test(normalized)) {
    return 'El correo ingresado no es valido.'
  }

  const mustBeString = normalized.match(/^(\w+) must be a string$/i)
  if (mustBeString) {
    return `El campo ${translateField(mustBeString[1])} debe ser texto.`
  }

  const mustBeNumber = normalized.match(
    /^(\w+) must be a number conforming to the specified constraints$/i,
  )
  if (mustBeNumber) {
    return `El campo ${translateField(mustBeNumber[1])} debe ser numerico.`
  }

  if (/invalid credentials/i.test(normalized)) {
    return 'Correo o contrasena incorrectos.'
  }

  if (/unauthorized|forbidden/i.test(normalized)) {
    return 'No tienes permiso para realizar esta accion.'
  }

  if (/unique constraint failed/i.test(normalized)) {
    return 'Ya existe un registro con esos mismos datos.'
  }

  const duplicatedUniqueValue = normalized.match(
    /^A (\w+) with that unique value already exists\.?$/i,
  )
  if (duplicatedUniqueValue) {
    const entity = duplicatedUniqueValue[1].toLowerCase()

    switch (entity) {
      case 'customer':
        return 'Ya existe un cliente con esos mismos datos.'
      case 'product':
        return 'Ya existe un producto con esos mismos datos.'
      case 'brand':
        return 'Ya existe una marca con esos mismos datos.'
      case 'campaign':
        return 'Ya existe una campana con esos mismos datos.'
      case 'combo':
        return 'Ya existe un combo con esos mismos datos.'
      default:
        return 'Ya existe un registro con esos mismos datos.'
    }
  }

  if (/a category with that name or slug already exists/i.test(normalized)) {
    return 'Ya existe una categoria con ese nombre o slug.'
  }

  if (/a user with that email already exists/i.test(normalized)) {
    return 'Ya existe una cuenta registrada con ese correo.'
  }

  if (/payments can only be registered for credit orders/i.test(normalized)) {
    return 'Los abonos solo se pueden registrar en pedidos a credito.'
  }

  if (/payment amount must be greater than zero/i.test(normalized)) {
    return 'El monto del abono debe ser mayor que cero.'
  }

  if (/payment amount cannot be greater than the pending balance/i.test(normalized)) {
    return 'El abono no puede ser mayor que el saldo pendiente.'
  }

  if (/you are not allowed to register a payment for this order/i.test(normalized)) {
    return 'No puedes registrar un abono para este pedido.'
  }

  if (/this customer is not approved for credit orders/i.test(normalized)) {
    return 'Este cliente no esta aprobado para comprar a credito.'
  }

  if (/this order exceeds the customer credit limit/i.test(normalized)) {
    return 'Este pedido supera el limite de credito del cliente.'
  }

  if (/credit orders require a registered customer approved for credit/i.test(normalized)) {
    return 'Los pedidos a credito requieren un cliente registrado y aprobado para credito.'
  }

  if (/one or more products in the order do not exist/i.test(normalized)) {
    return 'Uno o varios productos del pedido ya no existen.'
  }

  if (/product .* does not exist/i.test(normalized)) {
    return 'Uno de los productos seleccionados ya no existe.'
  }

  if (/product .* does not have enough stock/i.test(normalized)) {
    return 'Uno de los productos no tiene stock suficiente.'
  }

  if (/order .* not found/i.test(normalized)) {
    return 'No se encontro el pedido solicitado.'
  }

  if (/customer .* not found/i.test(normalized)) {
    return 'No se encontro el cliente solicitado.'
  }

  if (/brand .* not found/i.test(normalized)) {
    return 'No se encontro la marca solicitada.'
  }

  if (/category .* not found/i.test(normalized)) {
    return 'No se encontro la categoria solicitada.'
  }

  if (/the authenticated user does not have a customer profile yet/i.test(normalized)) {
    return 'Tu cuenta todavia no tiene un perfil de cliente asociado.'
  }

  if (/was not found for the authenticated customer/i.test(normalized)) {
    return 'No se encontro ese pedido dentro de tu cuenta.'
  }

  if (/request failed/i.test(normalized)) {
    return 'No se pudo completar la solicitud.'
  }

  return normalized
}

export function translateApiMessage(
  message: string | string[] | undefined,
  fallback = 'No se pudo completar la solicitud.',
) {
  if (!message) {
    return fallback
  }

  const parts = Array.isArray(message) ? message : [message]
  const translated = parts.map(translateSingleMessage).filter(Boolean)

  return translated.length > 0 ? translated.join(' ') : fallback
}
