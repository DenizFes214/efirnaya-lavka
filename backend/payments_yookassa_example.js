// backend/payments_yookassa_example.js
// Пример шаблона обработки webhook ЮKassa
// Поместите секрет в env YOOKASSA_SECRET и реализуйте проверку подписи

export function yookassaWebhookHandler(req, res){
  const secret = process.env.YOOKASSA_SECRET || '';
  const signature = req.get('Content-HMAC') || req.get('HTTP_CONTENT_HMAC');
  // TODO: вычислить HMAC и сравнить с signature
  // payload доступен в req.body
  console.log('YooHook', req.body);
  // Пример: обновить заказ по id в req.body.object.payment.id
  res.status(200).send('ok');
}
