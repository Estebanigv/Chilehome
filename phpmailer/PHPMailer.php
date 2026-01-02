<?php
/**
 * PHPMailer - Full-featured email creation and transfer class
 * Simplified version for Chile Home SMTP
 */

namespace PHPMailer\PHPMailer;

class PHPMailer
{
    const CHARSET_ISO88591 = 'iso-8859-1';
    const CHARSET_UTF8 = 'utf-8';
    const CONTENT_TYPE_PLAINTEXT = 'text/plain';
    const CONTENT_TYPE_TEXT_HTML = 'text/html';
    const ENCODING_7BIT = '7bit';
    const ENCODING_8BIT = '8bit';
    const ENCODING_BASE64 = 'base64';
    const ENCODING_BINARY = 'binary';
    const ENCODING_QUOTED_PRINTABLE = 'quoted-printable';
    const ENCRYPTION_STARTTLS = 'tls';
    const ENCRYPTION_SMTPS = 'ssl';

    public $Priority;
    public $CharSet = self::CHARSET_UTF8;
    public $ContentType = self::CONTENT_TYPE_PLAINTEXT;
    public $Encoding = self::ENCODING_8BIT;
    public $ErrorInfo = '';
    public $From = '';
    public $FromName = '';
    public $Sender = '';
    public $Subject = '';
    public $Body = '';
    public $AltBody = '';
    public $Ical = '';
    public $MIMEBody = '';
    public $MIMEHeader = '';
    public $mailHeader = '';
    protected $MIMEMessage = '';
    public $WordWrap = 0;
    public $Mailer = 'mail';
    public $Sendmail = '/usr/sbin/sendmail';
    public $UseSendmailOptions = true;
    public $ConfirmReadingTo = '';
    public $Hostname = '';
    public $MessageID = '';
    public $MessageDate = '';
    public $Host = 'localhost';
    public $Port = 25;
    public $Helo = '';
    public $SMTPSecure = '';
    public $SMTPAutoTLS = true;
    public $SMTPAuth = false;
    public $SMTPOptions = [];
    public $Username = '';
    public $Password = '';
    public $AuthType = '';
    public $oauth;
    public $Timeout = 300;
    public $dsn = '';
    public $SMTPDebug = 0;
    public $Debugoutput = 'echo';
    public $SMTPKeepAlive = false;
    public $SingleTo = false;
    public $do_verp = false;
    public $AllowEmpty = false;
    public $DKIM_selector = '';
    public $DKIM_identity = '';
    public $DKIM_passphrase = '';
    public $DKIM_domain = '';
    public $DKIM_copyHeaderFields = true;
    public $DKIM_extraHeaders = [];
    public $DKIM_private = '';
    public $DKIM_private_string = '';
    public $action_function = '';
    public $XMailer = '';
    public static $validator = 'php';

    protected $smtp;
    protected $to = [];
    protected $cc = [];
    protected $bcc = [];
    protected $ReplyTo = [];
    protected $all_recipients = [];
    protected $RecipientsQueue = [];
    protected $ReplyToQueue = [];
    protected $attachment = [];
    protected $CustomHeader = [];
    protected $lastMessageID = '';
    protected $message_type = '';
    protected $boundary = [];
    protected $language = [];
    protected $error_count = 0;
    protected $sign_cert_file = '';
    protected $sign_key_file = '';
    protected $sign_extracerts_file = '';
    protected $sign_key_pass = '';
    protected $exceptions = false;
    protected $uniqueid = '';

    const STOP_MESSAGE = 0;
    const STOP_CONTINUE = 1;
    const STOP_CRITICAL = 2;

    const CRLF = "\r\n";
    const LE = "\r\n";

    public function __construct($exceptions = null)
    {
        if (null !== $exceptions) {
            $this->exceptions = (bool) $exceptions;
        }
        $this->Debugoutput = function ($str, $level) {};
    }

    public function isSMTP()
    {
        $this->Mailer = 'smtp';
    }

    public function isMail()
    {
        $this->Mailer = 'mail';
    }

    public function setFrom($address, $name = '', $auto = true)
    {
        $address = trim($address);
        $name = trim(preg_replace('/[\r\n]+/', '', $name));

        if (!static::validateAddress($address)) {
            $this->setError('Invalid address: ' . $address);
            if ($this->exceptions) {
                throw new Exception('Invalid address: ' . $address);
            }
            return false;
        }

        $this->From = $address;
        $this->FromName = $name;

        if ($auto && empty($this->Sender)) {
            $this->Sender = $address;
        }

        return true;
    }

    public function addAddress($address, $name = '')
    {
        return $this->addOrEnqueueAnAddress('to', $address, $name);
    }

    public function addCC($address, $name = '')
    {
        return $this->addOrEnqueueAnAddress('cc', $address, $name);
    }

    public function addBCC($address, $name = '')
    {
        return $this->addOrEnqueueAnAddress('bcc', $address, $name);
    }

    public function addReplyTo($address, $name = '')
    {
        return $this->addOrEnqueueAnAddress('Reply-To', $address, $name);
    }

    protected function addOrEnqueueAnAddress($kind, $address, $name)
    {
        $address = trim($address);
        $name = trim(preg_replace('/[\r\n]+/', '', $name));

        if (!static::validateAddress($address)) {
            $this->setError('Invalid address: ' . $address);
            if ($this->exceptions) {
                throw new Exception('Invalid address: ' . $address);
            }
            return false;
        }

        $pos = strtolower($kind);
        if ('reply-to' === $pos) {
            if (!array_key_exists($address, $this->ReplyTo)) {
                $this->ReplyTo[$address] = [$address, $name];
            }
            return true;
        }

        if (!array_key_exists($address, $this->all_recipients)) {
            $this->{$pos}[] = [$address, $name];
            $this->all_recipients[$address] = true;
            return true;
        }

        return false;
    }

    public static function validateAddress($address, $patternselect = null)
    {
        if (null === $patternselect) {
            $patternselect = static::$validator;
        }

        if ($patternselect === 'php') {
            return (bool) filter_var($address, FILTER_VALIDATE_EMAIL);
        }

        return (bool) preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $address);
    }

    public function isHTML($isHtml = true)
    {
        if ($isHtml) {
            $this->ContentType = static::CONTENT_TYPE_TEXT_HTML;
        } else {
            $this->ContentType = static::CONTENT_TYPE_PLAINTEXT;
        }
    }

    public function send()
    {
        try {
            if (!$this->preSend()) {
                return false;
            }
            return $this->postSend();
        } catch (Exception $exc) {
            $this->mailHeader = '';
            $this->setError($exc->getMessage());
            if ($this->exceptions) {
                throw $exc;
            }
            return false;
        }
    }

    public function preSend()
    {
        if (empty($this->to) && empty($this->cc) && empty($this->bcc)) {
            throw new Exception('You must provide at least one recipient email address.');
        }

        if (empty($this->From)) {
            throw new Exception('You must provide a sender email address.');
        }

        if (empty($this->Subject)) {
            $this->Subject = '(No Subject)';
        }

        $this->setMessageType();
        $this->MIMEHeader = $this->createHeader();
        $this->MIMEBody = $this->createBody();

        return true;
    }

    public function postSend()
    {
        if ('smtp' === $this->Mailer) {
            return $this->smtpSend($this->MIMEHeader, $this->MIMEBody);
        }
        return $this->mailSend($this->MIMEHeader, $this->MIMEBody);
    }

    protected function smtpSend($header, $body)
    {
        $bad_rcpt = [];
        if (!$this->smtpConnect()) {
            throw new Exception('SMTP connect() failed.');
        }

        $smtp_from = $this->Sender ?: $this->From;

        if (!$this->smtp->mail($smtp_from)) {
            $this->setError('SMTP Error: ' . implode('; ', $this->smtp->getError()));
            throw new Exception('SMTP Error: Could not authenticate.');
        }

        $callbacks = [];
        foreach ([$this->to, $this->cc, $this->bcc] as $togroup) {
            foreach ($togroup as $to) {
                if (!$this->smtp->recipient($to[0], $this->dsn)) {
                    $error = $this->smtp->getError();
                    $bad_rcpt[] = ['to' => $to[0], 'error' => $error['detail']];
                    $callbacks[] = ['issent' => false, 'to' => $to[0]];
                } else {
                    $callbacks[] = ['issent' => true, 'to' => $to[0]];
                }
            }
        }

        if (count($bad_rcpt) > 0 && count($bad_rcpt) === count($this->all_recipients)) {
            throw new Exception('SMTP Error: All recipients failed.');
        }

        if (!$this->smtp->data($header . $body)) {
            throw new Exception('SMTP Error: data not accepted.');
        }

        if (!$this->SMTPKeepAlive) {
            $this->smtp->quit();
        }

        return true;
    }

    public function smtpConnect($options = null)
    {
        if (null === $this->smtp) {
            $this->smtp = new SMTP();
        }

        if (null === $options) {
            $options = $this->SMTPOptions;
        }

        $hosts = explode(';', $this->Host);
        $lastexception = null;

        foreach ($hosts as $hostentry) {
            $hostinfo = [];
            if (!preg_match('/^(?:(ssl|tls):\/\/)?(.+?)(?::(\d+))?$/', trim($hostentry), $hostinfo)) {
                continue;
            }

            $prefix = '';
            $secure = $this->SMTPSecure;
            $host = $hostinfo[2];
            $port = $this->Port;

            if (isset($hostinfo[1]) && $hostinfo[1] !== '') {
                $secure = $hostinfo[1];
            }

            if (isset($hostinfo[3]) && $hostinfo[3] !== '') {
                $port = (int) $hostinfo[3];
            }

            if ('ssl' === $secure || 'smtps' === $secure || static::ENCRYPTION_SMTPS === $secure) {
                $prefix = 'ssl://';
            }

            $streamOptions = [];
            if ('ssl' === $secure || 'smtps' === $secure || static::ENCRYPTION_SMTPS === $secure) {
                $streamOptions = [
                    'ssl' => [
                        'verify_peer' => false,
                        'verify_peer_name' => false,
                        'allow_self_signed' => true
                    ]
                ];
            }

            if (!$this->smtp->connect($prefix . $host, $port, $this->Timeout, array_merge($streamOptions, $options))) {
                continue;
            }

            if (!$this->smtp->hello(gethostname())) {
                $this->smtp->close();
                continue;
            }

            if ('tls' === $secure || static::ENCRYPTION_STARTTLS === $secure) {
                if (!$this->smtp->startTLS()) {
                    $this->smtp->close();
                    continue;
                }
                $this->smtp->hello(gethostname());
            }

            if ($this->SMTPAuth) {
                if (!$this->smtp->authenticate($this->Username, $this->Password, $this->AuthType, $this->oauth)) {
                    $this->smtp->close();
                    $this->setError('SMTP Error: Authentication failed.');
                    throw new Exception('SMTP Error: Authentication failed.');
                }
            }

            return true;
        }

        throw new Exception('SMTP Error: Could not connect to SMTP host.');
    }

    protected function mailSend($header, $body)
    {
        $toArr = [];
        foreach ($this->to as $to) {
            $toArr[] = $this->addrFormat($to);
        }
        $to = implode(', ', $toArr);

        $params = null;
        if (!empty($this->Sender) && strlen(ini_get('safe_mode')) < 1) {
            $params = sprintf('-f%s', $this->Sender);
        }

        $result = @mail($to, $this->encodeHeader($this->secureHeader($this->Subject)), $body, $header, $params);

        return (bool) $result;
    }

    protected function setMessageType()
    {
        $type = [];
        if ($this->alternativeExists()) {
            $type[] = 'alt';
        }
        if ($this->inlineImageExists()) {
            $type[] = 'inline';
        }
        if ($this->attachmentExists()) {
            $type[] = 'attach';
        }
        $this->message_type = implode('_', $type);
        if ('' === $this->message_type) {
            $this->message_type = 'plain';
        }
    }

    public function createHeader()
    {
        $result = '';

        $result .= $this->headerLine('Date', '' === $this->MessageDate ? static::rfcDate() : $this->MessageDate);

        if ('' === $this->MessageID) {
            $this->MessageID = $this->generateId();
        }
        $result .= $this->headerLine('Message-ID', '<' . $this->MessageID . '>');

        $result .= $this->addrAppend('From', [[$this->From, $this->FromName]]);

        foreach (['to', 'cc'] as $to_type) {
            $addr = $this->{$to_type};
            if (count($addr) > 0) {
                $result .= $this->addrAppend(ucfirst($to_type), $addr);
            }
        }

        if (count($this->ReplyTo) > 0) {
            $result .= $this->addrAppend('Reply-To', $this->ReplyTo);
        }

        $result .= $this->headerLine('Subject', $this->encodeHeader($this->secureHeader($this->Subject)));
        $result .= $this->headerLine('MIME-Version', '1.0');
        $result .= $this->getMailMIME();

        return $result;
    }

    public function createBody()
    {
        $body = '';
        $this->uniqueid = $this->generateId();
        $this->boundary[1] = 'b1_' . $this->uniqueid;
        $this->boundary[2] = 'b2_' . $this->uniqueid;

        if ($this->alternativeExists()) {
            $body .= '--' . $this->boundary[1] . static::LE;
            $body .= sprintf('Content-Type: %s; charset=%s', static::CONTENT_TYPE_PLAINTEXT, $this->CharSet) . static::LE;
            $body .= 'Content-Transfer-Encoding: ' . static::ENCODING_8BIT . static::LE . static::LE;
            $body .= $this->encodeString($this->AltBody, static::ENCODING_8BIT);
            $body .= static::LE . '--' . $this->boundary[1] . static::LE;
            $body .= sprintf('Content-Type: %s; charset=%s', static::CONTENT_TYPE_TEXT_HTML, $this->CharSet) . static::LE;
            $body .= 'Content-Transfer-Encoding: ' . static::ENCODING_8BIT . static::LE . static::LE;
            $body .= $this->encodeString($this->Body, static::ENCODING_8BIT);
            $body .= static::LE . '--' . $this->boundary[1] . '--' . static::LE;
        } else {
            $body = $this->encodeString($this->Body, static::ENCODING_8BIT);
        }

        return $body;
    }

    protected function getMailMIME()
    {
        $result = '';

        if ($this->alternativeExists()) {
            $result .= $this->headerLine('Content-Type', 'multipart/alternative; boundary="' . $this->boundary[1] . '"');
        } else {
            $result .= $this->headerLine('Content-Type', $this->ContentType . '; charset=' . $this->CharSet);
            $result .= $this->headerLine('Content-Transfer-Encoding', static::ENCODING_8BIT);
        }

        return $result;
    }

    public function headerLine($name, $value)
    {
        return $name . ': ' . $value . static::LE;
    }

    public function addrAppend($type, $addr)
    {
        $addresses = [];
        foreach ($addr as $address) {
            $addresses[] = $this->addrFormat($address);
        }
        return $type . ': ' . implode(', ', $addresses) . static::LE;
    }

    public function addrFormat($addr)
    {
        if (empty($addr[1])) {
            return $addr[0];
        }
        return $this->encodeHeader($addr[1]) . ' <' . $addr[0] . '>';
    }

    public function encodeHeader($str, $position = 'text')
    {
        $matchcount = 0;
        switch (strtolower($position)) {
            case 'phrase':
                if (preg_match('/[\x80-\xFF]/', $str)) {
                    return '=?' . $this->CharSet . '?B?' . base64_encode($str) . '?=';
                }
                return $str;
            case 'text':
            default:
                if (preg_match('/[\x80-\xFF]/', $str)) {
                    return '=?' . $this->CharSet . '?B?' . base64_encode($str) . '?=';
                }
                return $str;
        }
    }

    public function encodeString($str, $encoding = self::ENCODING_BASE64)
    {
        $encoded = '';
        switch (strtolower($encoding)) {
            case static::ENCODING_BASE64:
                $encoded = chunk_split(base64_encode($str), 76, static::LE);
                break;
            case static::ENCODING_7BIT:
            case static::ENCODING_8BIT:
                $encoded = static::normalizeBreaks($str);
                if (substr($encoded, -strlen(static::LE)) !== static::LE) {
                    $encoded .= static::LE;
                }
                break;
            case static::ENCODING_BINARY:
                $encoded = $str;
                break;
            case static::ENCODING_QUOTED_PRINTABLE:
                $encoded = $this->encodeQP($str);
                break;
            default:
                $encoded = $str;
        }
        return $encoded;
    }

    public function encodeQP($string)
    {
        return quoted_printable_encode($string);
    }

    public static function normalizeBreaks($text, $breaktype = null)
    {
        if (null === $breaktype) {
            $breaktype = static::LE;
        }
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        if ("\n" !== $breaktype) {
            $text = str_replace("\n", $breaktype, $text);
        }
        return $text;
    }

    public function secureHeader($str)
    {
        return trim(str_replace(["\r", "\n"], '', $str));
    }

    public function generateId()
    {
        $len = 32;
        $bytes = random_bytes($len);
        return sprintf('%s@%s', bin2hex($bytes), !empty($this->Hostname) ? $this->Hostname : gethostname());
    }

    public static function rfcDate()
    {
        date_default_timezone_set(@date_default_timezone_get());
        return date('D, j M Y H:i:s O');
    }

    protected function alternativeExists()
    {
        return !empty($this->AltBody);
    }

    protected function inlineImageExists()
    {
        foreach ($this->attachment as $attachment) {
            if ('inline' === $attachment[6]) {
                return true;
            }
        }
        return false;
    }

    protected function attachmentExists()
    {
        foreach ($this->attachment as $attachment) {
            if ('attachment' === $attachment[6]) {
                return true;
            }
        }
        return false;
    }

    public function clearAddresses()
    {
        foreach ($this->to as $to) {
            unset($this->all_recipients[strtolower($to[0])]);
        }
        $this->to = [];
        $this->clearQueuedAddresses('to');
    }

    public function clearCCs()
    {
        foreach ($this->cc as $cc) {
            unset($this->all_recipients[strtolower($cc[0])]);
        }
        $this->cc = [];
        $this->clearQueuedAddresses('cc');
    }

    public function clearBCCs()
    {
        foreach ($this->bcc as $bcc) {
            unset($this->all_recipients[strtolower($bcc[0])]);
        }
        $this->bcc = [];
        $this->clearQueuedAddresses('bcc');
    }

    public function clearReplyTos()
    {
        $this->ReplyTo = [];
        $this->ReplyToQueue = [];
    }

    public function clearAllRecipients()
    {
        $this->to = [];
        $this->cc = [];
        $this->bcc = [];
        $this->all_recipients = [];
        $this->RecipientsQueue = [];
    }

    public function clearAttachments()
    {
        $this->attachment = [];
    }

    public function clearCustomHeaders()
    {
        $this->CustomHeader = [];
    }

    protected function clearQueuedAddresses($kind)
    {
        $this->RecipientsQueue = array_filter(
            $this->RecipientsQueue,
            static function ($params) use ($kind) {
                return $params[0] !== $kind;
            }
        );
    }

    protected function setError($msg)
    {
        ++$this->error_count;
        $this->ErrorInfo = $msg;
    }

    public function isError()
    {
        return $this->error_count > 0;
    }
}
