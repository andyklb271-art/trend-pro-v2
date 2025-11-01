import express from 'express';
import crypto from 'crypto';
import fetch from 'node-fetch';

const router = express.Router();

const val  = (v) => (v ?? '').toString().trim();
const KEY  = val(process.env.TIKTOK_CLIENT_KEY);
const SEC  = val(process.env.TIKTOK_CLIENT_SECRET);
const REDI = val(process.env.REDIRECT_URI);
const FRONT= val(process.env.FRONTEND_ORIGIN || 'https://trend-pro.onrender.com');
let SCOPES = val(process.env.TIKTOK_SCOPES || 'user.info.basic user.info.profile');
SCOPES = SCOPES.replace(/,/g,' ').replace(/\s+/g,' ').trim();

// --- Helpers
const b64url = (b)=>b.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const genV   = ()=> b64url(crypto.randomBytes(64));
const chal   = (v)=> b64url(crypto.createHash('sha256').update(v).digest());

router.get('/debug', (_req,res)=>{
  res.json({ key_present: !!KEY, secret_present: !!SEC, redirect_uri: REDI, front: FRONT, scopes: SCOPES });
});

router.get('/login',(req,res)=>{
  const state = crypto.randomBytes(16).toString('hex');
  const ver = genV(); const ch = chal(ver);
  res.cookie('tt_code_verifier', ver, { httpOnly:true, sameSite:'lax', secure:true });

  const u = new URL('https://www.tiktok.com/v2/auth/authorize/');
  u.searchParams.set('client_key', KEY);
  u.searchParams.set('scope', SCOPES);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('redirect_uri', REDI);
  u.searchParams.set('state', state);
  u.searchParams.set('code_challenge', ch);
  u.searchParams.set('code_challenge_method', 'S256');
  res.redirect(u.toString());
});

async function exchange(body){
  const form = new URLSearchParams(body);
  const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/',{
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
    body: form.toString()
  });
  const text = await r.text();
  let data; try{ data = JSON.parse(text);} catch { data = { raw:text }; }
  return { r, data };
}

async function saveSessionAndRedirect(req, res, tokenData){
  const access = tokenData?.data?.access_token ?? tokenData?.access_token;
  if (!access) {
    return res.status(400).type('text').send('No access_token in token response: '+JSON.stringify(tokenData));
  }
  if (typeof req.__setSession === 'function') {
    await req.__setSession({ access_token: access });
  }
  // Direkt zu /api/me (Backend liefert Userinfo)
  return res.redirect(${FRONT}/api/me?auth=ok);
}

router.get('/callback', async (req,res)=>{
  const { code, error, error_description } = req.query;
  if (error) return res.status(400).send(TikTok Error: Die Benennung "https://trend-pro.onrender.com/health" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "https://trend-pro.onrender.com/auth/tiktok/debug" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "https://trend-pro.onrender.com/debug-env" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:119
+ ... function clearSession[\s\S]+?res.clearCookie\(\'sid\'\);\n\}', $patch ...
+                                                     ~~~~~~~~~~~~~
Unerwartetes Token "sid\'\);\n\}'" in Ausdruck oder Anweisung.

In Zeile:1 Zeichen:132
+ ... unction clearSession[\s\S]+?res.clearCookie\(\'sid\'\);\n\}', $patch) ...
+                                                                 ~
Argument in der Parameterliste fehlt.

In Zeile:1 Zeichen:140
+ ... ction clearSession[\s\S]+?res.clearCookie\(\'sid\'\);\n\}', $patch) |
+                                                                       ~
Unerwartetes Token ")" in Ausdruck oder Anweisung.

In Zeile:1 Zeichen:142
+ ... ction clearSession[\s\S]+?res.clearCookie\(\'sid\'\);\n\}', $patch) |
+                                                                         ~
Ein leeres Pipeelement ist nicht zulässig.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "https://trend-pro.onrender.com/auth/tiktok/login" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "https://trend-pro.onrender.com/auth/tiktok/debug" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "https://trend-pro.onrender.com/debug-env" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:24
+ Token response status: <STATUS> ok: <true/false>
+                        ~
Der Operator "<" ist für zukünftige Versionen reserviert.

In Zeile:1 Zeichen:37
+ Token response status: <STATUS> ok: <true/false>
+                                     ~
Der Operator "<" ist für zukünftige Versionen reserviert.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "POST" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "https://trend-pro.onrender.com/auth/tiktok/login" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "https://trend-pro.onrender.com/auth/tiktok/debug" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "https://trend-pro.onrender.com/debug-env" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "EOF" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "export" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:24
+ router.get("/callback", async (req, res) => {
+                        ~
Ausdruck nach "," fehlt.

In Zeile:1 Zeichen:25
+ router.get("/callback", async (req, res) => {
+                         ~~~~~
Unerwartetes Token "async" in Ausdruck oder Anweisung.

In Zeile:1 Zeichen:24
+ router.get("/callback", async (req, res) => {
+                        ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:1 Zeichen:35
+ router.get("/callback", async (req, res) => {
+                                   ~
Argument in der Parameterliste fehlt.

In Zeile:2 Zeichen:15
+   const { code, error, error_description } = req.query;
+               ~
Argument in der Parameterliste fehlt.

In Zeile:3 Zeichen:12
+   if (error) return res.status(400).send(`TikTok Error: ${error} - ${ ...
+            ~
Anweisungsblock nach "if" (Bedingung) fehlt.

In Zeile:3 Zeichen:42
+   if (error) return res.status(400).send(`TikTok Error: ${error} - ${ ...
+                                          ~
")" fehlt in einem Methodenaufruf.

In Zeile:4 Zeichen:12
+   if (!code) return res.status(400).send("Missing ?code parameter");
+            ~
Anweisungsblock nach "if" (Bedingung) fehlt.

In Zeile:9 Zeichen:32
+       headers: { "Content-Type": "application/json" },
+                                ~
Unerwartetes Token ":" in Ausdruck oder Anweisung.

In Zeile:15 Zeichen:36
+         redirect_uri: REDIRECT_URI,
+                                    ~
Ausdruck nach "," fehlt im Pipelineelement.

Es wurden nicht alle Analysefehler berichtet. Korrigieren Sie die berichteten Fehler, und versuchen Sie es erneut.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "//" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:1
+ });
+ ~
Unerwartetes Token "}" in Ausdruck oder Anweisung.

In Zeile:1 Zeichen:2
+ });
+  ~
Unerwartetes Token ")" in Ausdruck oder Anweisung.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:33
+   res.redirect(authUrl.toString());
+                                 ~
Nach "(" wurde ein Ausdruck erwartet.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:36
+   authUrl.searchParams.set("state", state);
+                                    ~
Ausdruck nach "," fehlt.

In Zeile:1 Zeichen:37
+   authUrl.searchParams.set("state", state);
+                                     ~~~~~
Unerwartetes Token "state" in Ausdruck oder Anweisung.

In Zeile:1 Zeichen:36
+   authUrl.searchParams.set("state", state);
+                                    ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:1 Zeichen:42
+   authUrl.searchParams.set("state", state);
+                                          ~
Unerwartetes Token ")" in Ausdruck oder Anweisung.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:43
+   authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
+                                           ~
Ausdruck nach "," fehlt.

In Zeile:1 Zeichen:44
+   authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
+                                            ~~~~~~~~~~~~
Unerwartetes Token "REDIRECT_URI" in Ausdruck oder Anweisung.

In Zeile:1 Zeichen:43
+   authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
+                                           ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:1 Zeichen:56
+   authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
+                                                        ~
Unerwartetes Token ")" in Ausdruck oder Anweisung.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "authUrl.searchParams.set" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "authUrl.searchParams.set" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:26
+ router.get("/login", (req, res) => {
+                          ~
Argument in der Parameterliste fehlt.

In Zeile:4 Zeichen:41
+   authUrl.searchParams.set("client_key", TIKTOK_CLIENT_KEY);
+                                         ~
Ausdruck nach "," fehlt.

In Zeile:4 Zeichen:42
+   authUrl.searchParams.set("client_key", TIKTOK_CLIENT_KEY);
+                                          ~~~~~~~~~~~~~~~~~
Unerwartetes Token "TIKTOK_CLIENT_KEY" in Ausdruck oder Anweisung.

In Zeile:4 Zeichen:41
+   authUrl.searchParams.set("client_key", TIKTOK_CLIENT_KEY);
+                                         ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:1 Zeichen:36
+ router.get("/login", (req, res) => {
+                                    ~
Die schließende "}" fehlt im Anweisungsblock oder der Typdefinition.

In Zeile:1 Zeichen:12
+ router.get("/login", (req, res) => {
+            ~~~~~~~~
Der Zuweisungsausdruck ist ungültig. Die Eingabe für einen Zuweisungsoperator muss ein Objekt sein, das Zuweisungen akzeptieren kann (z. B. eine Variable oder Eigenschaft).

In Zeile:1 Zeichen:23
+ router.get("/login", (req, res) => {
+                       ~~~~~~~~
Der Zuweisungsausdruck ist ungültig. Die Eingabe für einen Zuweisungsoperator muss ein Objekt sein, das Zuweisungen akzeptieren kann (z. B. eine Variable oder Eigenschaft).
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "//" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:2 Zeichen:20
+   TIKTOK_CLIENT_KEY,
+                    ~
Argument in der Parameterliste fehlt.

In Zeile:5 Zeichen:19
+   FRONTEND_ORIGIN,
+                   ~
Ausdruck nach "," fehlt im Pipelineelement.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:31
+ const router = express.Router();
+                               ~
Nach "(" wurde ein Ausdruck erwartet.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:25
+ cat > routes/tiktok.js <<'EOF'
+                         ~
Dateispezifikation nach dem Umleitungsoperator fehlt.

In Zeile:1 Zeichen:24
+ cat > routes/tiktok.js <<'EOF'
+                        ~
Der Operator "<" ist für zukünftige Versionen reserviert.

In Zeile:1 Zeichen:25
+ cat > routes/tiktok.js <<'EOF'
+                         ~
Der Operator "<" ist für zukünftige Versionen reserviert.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Der Parameter kann nicht verarbeitet werden, da der Parametername "f" nicht eindeutig ist. Mögliche Übereinstimmungen:  -Filter -Force. Die Benennung "https://trend-pro.onrender.com/auth/tiktok/login" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "https://trend-pro.onrender.com/health" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Der Pfad "C:\Users\andre\OneDrive\Desktop\trend-pro-v2\backend\backend" kann nicht gefunden werden, da er nicht vorhanden ist. Die Benennung "EOF" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:38
+ app.listen(Number(PORT), '0.0.0.0', () => {
+                                      ~
Nach "(" wurde ein Ausdruck erwartet.

In Zeile:2 Zeichen:35
+   console.log(`✅ API on :${PORT}`);
+                                   ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:3 Zeichen:53
+   console.log(`FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}`);
+                                                     ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:4 Zeichen:50
+   console.log(`REDIRECT_URI   : ${REDIRECT_URI}`);
+                                                  ~
Schließende ")" fehlt in einem Ausdruck.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:19
+ app.get('/', (_req, res) => {
+                   ~
Argument in der Parameterliste fehlt.

In Zeile:2 Zeichen:25
+   res.type('text').send(
+                         ~
")" fehlt in einem Methodenaufruf.

In Zeile:1 Zeichen:9
+ app.get('/', (_req, res) => {
+         ~~~
Der Zuweisungsausdruck ist ungültig. Die Eingabe für einen Zuweisungsoperator muss ein Objekt sein, das Zuweisungen akzeptieren kann (z. B. eine Variable oder Eigenschaft).

In Zeile:1 Zeichen:15
+ app.get('/', (_req, res) => {
+               ~~~~~~~~~
Der Zuweisungsausdruck ist ungültig. Die Eingabe für einen Zuweisungsoperator muss ein Objekt sein, das Zuweisungen akzeptieren kann (z. B. eine Variable oder Eigenschaft).
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:24
+ app.use('/auth/tiktok', tiktokRouter);
+                        ~
Ausdruck nach "," fehlt.

In Zeile:1 Zeichen:25
+ app.use('/auth/tiktok', tiktokRouter);
+                         ~~~~~~~~~~~~
Unerwartetes Token "tiktokRouter" in Ausdruck oder Anweisung.

In Zeile:1 Zeichen:24
+ app.use('/auth/tiktok', tiktokRouter);
+                        ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:1 Zeichen:37
+ app.use('/auth/tiktok', tiktokRouter);
+                                     ~
Unerwartetes Token ")" in Ausdruck oder Anweisung.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:25
+ app.get('/health', (_req, res) => res.json({ ok: true }));
+                         ~
Argument in der Parameterliste fehlt.

In Zeile:1 Zeichen:9
+ app.get('/health', (_req, res) => res.json({ ok: true }));
+         ~~~~~~~~~
Der Zuweisungsausdruck ist ungültig. Die Eingabe für einen Zuweisungsoperator muss ein Objekt sein, das Zuweisungen akzeptieren kann (z. B. eine Variable oder Eigenschaft).

In Zeile:1 Zeichen:21
+ app.get('/health', (_req, res) => res.json({ ok: true }));
+                     ~~~~~~~~~
Der Zuweisungsausdruck ist ungültig. Die Eingabe für einen Zuweisungsoperator muss ein Objekt sein, das Zuweisungen akzeptieren kann (z. B. eine Variable oder Eigenschaft).
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "process.env.SESSION_SECRET" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "cors" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:22
+ app.use(express.json());
+                      ~
Nach "(" wurde ein Ausdruck erwartet.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:21
+ const app = express();
+                     ~
Nach "(" wurde ein Ausdruck erwartet.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:5 Zeichen:16
+   REDIRECT_URI,
+                ~
Ausdruck nach "," fehlt im Pipelineelement.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:18
+ cat > server.js <<'EOF'
+                  ~
Dateispezifikation nach dem Umleitungsoperator fehlt.

In Zeile:1 Zeichen:17
+ cat > server.js <<'EOF'
+                 ~
Der Operator "<" ist für zukünftige Versionen reserviert.

In Zeile:1 Zeichen:18
+ cat > server.js <<'EOF'
+                  ~
Der Operator "<" ist für zukünftige Versionen reserviert.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) FileStream sollte ein Gerät öffnen, das keine Datei ist. Wenn Sie Unterstützung für Geräte benötigen, z. B. "com1" oder "lpt1:", rufen Sie CreateFile auf, bevor Sie die FileStream-Konstruktoren verwenden, die ein OS Betriebssystemhandle als IntPtr behandeln. Der Pfad "C:\Users\andre\OneDrive\Desktop\trend-pro-v2\backend\backend" kann nicht gefunden werden, da er nicht vorhanden ist. Die Benennung "EOF" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "export" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:24
+ router.get("/callback", async (req, res) => {
+                        ~
Ausdruck nach "," fehlt.

In Zeile:1 Zeichen:25
+ router.get("/callback", async (req, res) => {
+                         ~~~~~
Unerwartetes Token "async" in Ausdruck oder Anweisung.

In Zeile:1 Zeichen:24
+ router.get("/callback", async (req, res) => {
+                        ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:1 Zeichen:35
+ router.get("/callback", async (req, res) => {
+                                   ~
Argument in der Parameterliste fehlt.

In Zeile:2 Zeichen:15
+   const { code, state, error, error_description } = req.query;
+               ~
Argument in der Parameterliste fehlt.

In Zeile:4 Zeichen:12
+   if (error) return res.status(400).send(`TikTok returned error: ${er ...
+            ~
Anweisungsblock nach "if" (Bedingung) fehlt.

In Zeile:4 Zeichen:42
+   if (error) return res.status(400).send(`TikTok returned error: ${er ...
+                                          ~
")" fehlt in einem Methodenaufruf.

In Zeile:5 Zeichen:12
+   if (!code) return res.status(400).send("Missing ?code in callback." ...
+            ~
Anweisungsblock nach "if" (Bedingung) fehlt.

In Zeile:10 Zeichen:32
+       headers: { "Content-Type": "application/json" },
+                                ~
Unerwartetes Token ":" in Ausdruck oder Anweisung.

In Zeile:16 Zeichen:36
+         redirect_uri: REDIRECT_URI,
+                                    ~
Ausdruck nach "," fehlt im Pipelineelement.

Es wurden nicht alle Analysefehler berichtet. Korrigieren Sie die berichteten Fehler, und versuchen Sie es erneut.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:1
+ });
+ ~
Unerwartetes Token "}" in Ausdruck oder Anweisung.

In Zeile:1 Zeichen:2
+ });
+  ~
Unerwartetes Token ")" in Ausdruck oder Anweisung.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "state" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:26
+ router.get("/login", (req, res) => {
+                          ~
Argument in der Parameterliste fehlt.

In Zeile:3 Zeichen:35
+   res.cookie("tiktok_oauth_state", state, { httpOnly: true, sameSite: ...
+                                   ~
Ausdruck nach "," fehlt.

In Zeile:3 Zeichen:36
+   res.cookie("tiktok_oauth_state", state, { httpOnly: true, sameSite: ...
+                                    ~~~~~
Unerwartetes Token "state" in Ausdruck oder Anweisung.

In Zeile:3 Zeichen:35
+   res.cookie("tiktok_oauth_state", state, { httpOnly: true, sameSite: ...
+                                   ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:1 Zeichen:36
+ router.get("/login", (req, res) => {
+                                    ~
Die schließende "}" fehlt im Anweisungsblock oder der Typdefinition.

In Zeile:1 Zeichen:12
+ router.get("/login", (req, res) => {
+            ~~~~~~~~
Der Zuweisungsausdruck ist ungültig. Die Eingabe für einen Zuweisungsoperator muss ein Objekt sein, das Zuweisungen akzeptieren kann (z. B. eine Variable oder Eigenschaft).

In Zeile:1 Zeichen:23
+ router.get("/login", (req, res) => {
+                       ~~~~~~~~
Der Zuweisungsausdruck ist ungültig. Die Eingabe für einen Zuweisungsoperator muss ein Objekt sein, das Zuweisungen akzeptieren kann (z. B. eine Variable oder Eigenschaft).
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:1
+ }
+ ~
Unerwartetes Token "}" in Ausdruck oder Anweisung.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:21
+   return u.toString();
+                     ~
Nach "(" wurde ein Ausdruck erwartet.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:30
+   u.searchParams.set("state", state);
+                              ~
Ausdruck nach "," fehlt.

In Zeile:1 Zeichen:31
+   u.searchParams.set("state", state);
+                               ~~~~~
Unerwartetes Token "state" in Ausdruck oder Anweisung.

In Zeile:1 Zeichen:30
+   u.searchParams.set("state", state);
+                              ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:1 Zeichen:36
+   u.searchParams.set("state", state);
+                                    ~
Unerwartetes Token ")" in Ausdruck oder Anweisung.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:37
+   u.searchParams.set("redirect_uri", REDIRECT_URI);
+                                     ~
Ausdruck nach "," fehlt.

In Zeile:1 Zeichen:38
+   u.searchParams.set("redirect_uri", REDIRECT_URI);
+                                      ~~~~~~~~~~~~
Unerwartetes Token "REDIRECT_URI" in Ausdruck oder Anweisung.

In Zeile:1 Zeichen:37
+   u.searchParams.set("redirect_uri", REDIRECT_URI);
+                                     ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:1 Zeichen:50
+   u.searchParams.set("redirect_uri", REDIRECT_URI);
+                                                  ~
Unerwartetes Token ")" in Ausdruck oder Anweisung.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "u.searchParams.set" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "u.searchParams.set" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:23
+ function buildAuthUrl(state) {
+                       ~
")" fehlt in Funktionsparameterliste.

In Zeile:1 Zeichen:28
+ function buildAuthUrl(state) {
+                            ~
Unerwartetes Token ")" in Ausdruck oder Anweisung.

In Zeile:3 Zeichen:35
+   u.searchParams.set("client_key", TIKTOK_CLIENT_KEY);
+                                   ~
Ausdruck nach "," fehlt.

In Zeile:3 Zeichen:36
+   u.searchParams.set("client_key", TIKTOK_CLIENT_KEY);
+                                    ~~~~~~~~~~~~~~~~~
Unerwartetes Token "TIKTOK_CLIENT_KEY" in Ausdruck oder Anweisung.

In Zeile:3 Zeichen:35
+   u.searchParams.set("client_key", TIKTOK_CLIENT_KEY);
+                                   ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:1 Zeichen:30
+ function buildAuthUrl(state) {
+                              ~
Die schließende "}" fehlt im Anweisungsblock oder der Typdefinition.

In Zeile:3 Zeichen:53
+   u.searchParams.set("client_key", TIKTOK_CLIENT_KEY);
+                                                     ~
Unerwartetes Token ")" in Ausdruck oder Anweisung.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:2 Zeichen:20
+   TIKTOK_CLIENT_KEY,
+                    ~
Argument in der Parameterliste fehlt.

In Zeile:4 Zeichen:16
+   REDIRECT_URI,
+                ~
Ausdruck nach "," fehlt im Pipelineelement.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:31
+ const router = express.Router();
+                               ~
Nach "(" wurde ein Ausdruck erwartet.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:25
+ cat > routes/tiktok.js <<'EOF'
+                         ~
Dateispezifikation nach dem Umleitungsoperator fehlt.

In Zeile:1 Zeichen:24
+ cat > routes/tiktok.js <<'EOF'
+                        ~
Der Operator "<" ist für zukünftige Versionen reserviert.

In Zeile:1 Zeichen:25
+ cat > routes/tiktok.js <<'EOF'
+                         ~
Der Operator "<" ist für zukünftige Versionen reserviert.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Ein Element mit dem angegebenen Namen "C:\Users\andre\OneDrive\Desktop\trend-pro-v2\backend\routes" ist bereits vorhanden. Der Pfad "C:\Users\andre\OneDrive\Desktop\trend-pro-v2\backend\backend" kann nicht gefunden werden, da er nicht vorhanden ist. Die Benennung "EOF" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "SESSION_SECRET=please-change-me" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "TIKTOK_CLIENT_SECRET=DEIN_CLIENT_SECRET" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "TIKTOK_CLIENT_KEY=DEIN_CLIENT_KEY" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "REDIRECT_URI=https://trend-pro.onrender.com/auth/tiktok/callback" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "FRONTEND_ORIGIN=https://trend-pro.onrender.com" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "NODE_ENV=production" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "PORT=3000" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:13
+ cat > .env <<'EOF'
+             ~
Dateispezifikation nach dem Umleitungsoperator fehlt.

In Zeile:1 Zeichen:12
+ cat > .env <<'EOF'
+            ~
Der Operator "<" ist für zukünftige Versionen reserviert.

In Zeile:1 Zeichen:13
+ cat > .env <<'EOF'
+             ~
Der Operator "<" ist für zukünftige Versionen reserviert.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Der Pfad "C:\Users\andre\OneDrive\Desktop\trend-pro-v2\backend\backend" kann nicht gefunden werden, da er nicht vorhanden ist. Die Benennung "EOF" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:38
+ app.listen(Number(PORT), '0.0.0.0', () => {
+                                      ~
Nach "(" wurde ein Ausdruck erwartet.

In Zeile:2 Zeichen:35
+   console.log(`✅ API on :${PORT}`);
+                                   ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:3 Zeichen:53
+   console.log(`FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}`);
+                                                     ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:4 Zeichen:50
+   console.log(`REDIRECT_URI   : ${REDIRECT_URI}`);
+                                                  ~
Schließende ")" fehlt in einem Ausdruck.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "//" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:19
+ app.get('/', (_req, res) => {
+                   ~
Argument in der Parameterliste fehlt.

In Zeile:2 Zeichen:25
+   res.type('text').send(
+                         ~
")" fehlt in einem Methodenaufruf.

In Zeile:1 Zeichen:9
+ app.get('/', (_req, res) => {
+         ~~~
Der Zuweisungsausdruck ist ungültig. Die Eingabe für einen Zuweisungsoperator muss ein Objekt sein, das Zuweisungen akzeptieren kann (z. B. eine Variable oder Eigenschaft).

In Zeile:1 Zeichen:15
+ app.get('/', (_req, res) => {
+               ~~~~~~~~~
Der Zuweisungsausdruck ist ungültig. Die Eingabe für einen Zuweisungsoperator muss ein Objekt sein, das Zuweisungen akzeptieren kann (z. B. eine Variable oder Eigenschaft).
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "//" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:24
+ app.use('/auth/tiktok', tiktokRouter);
+                        ~
Ausdruck nach "," fehlt.

In Zeile:1 Zeichen:25
+ app.use('/auth/tiktok', tiktokRouter);
+                         ~~~~~~~~~~~~
Unerwartetes Token "tiktokRouter" in Ausdruck oder Anweisung.

In Zeile:1 Zeichen:24
+ app.use('/auth/tiktok', tiktokRouter);
+                        ~
Schließende ")" fehlt in einem Ausdruck.

In Zeile:1 Zeichen:37
+ app.use('/auth/tiktok', tiktokRouter);
+                                     ~
Unerwartetes Token ")" in Ausdruck oder Anweisung.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "//" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:25
+ app.get('/health', (_req, res) => res.json({ ok: true }));
+                         ~
Argument in der Parameterliste fehlt.

In Zeile:1 Zeichen:9
+ app.get('/health', (_req, res) => res.json({ ok: true }));
+         ~~~~~~~~~
Der Zuweisungsausdruck ist ungültig. Die Eingabe für einen Zuweisungsoperator muss ein Objekt sein, das Zuweisungen akzeptieren kann (z. B. eine Variable oder Eigenschaft).

In Zeile:1 Zeichen:21
+ app.get('/health', (_req, res) => res.json({ ok: true }));
+                     ~~~~~~~~~
Der Zuweisungsausdruck ist ungültig. Die Eingabe für einen Zuweisungsoperator muss ein Objekt sein, das Zuweisungen akzeptieren kann (z. B. eine Variable oder Eigenschaft).
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "//" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "process.env.SESSION_SECRET" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "cors" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:22
+ app.use(express.json());
+                      ~
Nach "(" wurde ein Ausdruck erwartet.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:1 Zeichen:21
+ const app = express();
+                     ~
Nach "(" wurde ein Ausdruck erwartet.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) System.Management.Automation.ParseException: In Zeile:5 Zeichen:16
+   REDIRECT_URI,
+                ~
Ausdruck nach "," fehlt im Pipelineelement.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. Die Benennung "import" wurde nicht als Name eines Cmdlet, einer Funktion, einer Skriptdatei oder eines ausführbaren Programms erkannt. Überprüfen Sie die Schreibweise des Namens, oder ob der Pfad korrekt ist (sofern enthalten), und wiederholen Sie den Vorgang. System.Management.Automation.ParseException: In Zeile:1 Zeichen:18
+ cat > server.js <<'EOF'
+                  ~
Dateispezifikation nach dem Umleitungsoperator fehlt.

In Zeile:1 Zeichen:17
+ cat > server.js <<'EOF'
+                 ~
Der Operator "<" ist für zukünftige Versionen reserviert.

In Zeile:1 Zeichen:18
+ cat > server.js <<'EOF'
+                  ~
Der Operator "<" ist für zukünftige Versionen reserviert.
   bei System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   bei Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) FileStream sollte ein Gerät öffnen, das keine Datei ist. Wenn Sie Unterstützung für Geräte benötigen, z. B. "com1" oder "lpt1:", rufen Sie CreateFile auf, bevor Sie die FileStream-Konstruktoren verwenden, die ein OS Betriebssystemhandle als IntPtr behandeln. - );
  if (!code)  return res.status(400).send('Missing ?code');

  const decoded = decodeURIComponent(String(code).trim());
  const base = {
    client_key: KEY,
    client_secret: SEC,
    code: decoded,
    grant_type: 'authorization_code',
    redirect_uri: REDI.trim()
  };

  try {
    // Versuch A: minimal
    let { r, data } = await exchange(base);
    if (r.ok && !data?.error && !data?.error_code && !data?.data?.error_code) {
      return saveSessionAndRedirect(req,res,data);
    }

    // Bei 10002: PKCE mit code_verifier
    const ec = data?.error_code || data?.data?.error_code;
    if (ec === 10002) {
      const ver = req.cookies?.tt_code_verifier;
      const bodyB = ver ? { ...base, code_verifier: ver } : base;
      ({ r, data } = await exchange(bodyB));
      if (r.ok && !data?.error && !data?.error_code && !data?.data?.error_code) {
        res.clearCookie('tt_code_verifier');
        return saveSessionAndRedirect(req,res,data);
      }
    }

    return res.status(400).type('text').send('Token exchange failed: '+JSON.stringify(data));
  } catch (e) {
    return res.status(500).send('Token fetch failed: '+e.message);
  }
});

// optional: Logout (Session + Cookie löschen)
router.post('/logout', async (req,res)=>{
  const sid = req.signedCookies?.sid;
  if (sid && globalThis.SESSIONS?.delete) globalThis.SESSIONS.delete(sid);
  res.clearCookie('sid');
  res.json({ ok:true });
});

export default router;
