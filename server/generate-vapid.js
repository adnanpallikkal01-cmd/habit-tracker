import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()
console.log('\nAdd these to Render Environment Variables:\n')
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log('VAPID_SUBJECT=mailto:your-email@example.com\n')
console.log('Add the same public key to Netlify as:')
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}\n`)
