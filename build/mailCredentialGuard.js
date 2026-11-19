// Build fails without echoing the credential, source contents or env values.
export function mailCredentialGuard() {
  const pattern=/SG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{25,}/;
  return {
    name:'mail-credential-boundary',enforce:'post',
    configResolved(config){if(Object.keys(config.env||{}).some(name=>/(?:SENDGRID.*KEY|SMTP.*PASSWORD)/i.test(name)))throw new Error('PRIVATE_MAIL_VARIABLE_EXPOSED_TO_BROWSER');},
    generateBundle(_options,bundle){for(const item of Object.values(bundle)){const content=item.type==='chunk'?item.code:String(item.source||'');if(pattern.test(content)||pattern.test(JSON.stringify(item.map||null)))throw new Error('PRIVATE_MAIL_CREDENTIAL_IN_BROWSER_OUTPUT');}},
  };
}
