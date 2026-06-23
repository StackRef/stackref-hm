resource "auth0_email" "amazon_ses_email_provider" {
  name                 = "ses"
  enabled              = true
  default_from_address = "StackRef <invitations@acme.example.com>"

  credentials {
    access_key_id     = var.auth0_email_iam_access_key_id
    secret_access_key = var.auth0_email_iam_secret_access_key
    region            = "us-east-1"
  }
}

resource "auth0_email_template" "verify_email_template" {
  depends_on = [auth0_email.amazon_ses_email_provider]

  template                = "verify_email"
  from                    = "StackRef <invitations@acme.example.com>"
  result_url              = "{{ application.callback_domain | default: \"https://app.acme.example.com\" }}/dashboard?email_verified=true"
  subject                 = "Welcome to StackRef"
  syntax                  = "liquid"
  url_lifetime_in_seconds = 432000
  enabled                 = true

  body = <<BODY
<html>
  <head>
    <style type="text/css">
      .ExternalClass,.ExternalClass div,.ExternalClass font,.ExternalClass p,.ExternalClass span,.ExternalClass td,img {line-height: 100%;}#outlook a {padding: 0;}.ExternalClass,.ReadMsgBody {width: 100%;}a,blockquote,body,li,p,table,td {-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;}table,td {mso-table-lspace: 0;mso-table-rspace: 0;}img {-ms-interpolation-mode: bicubic;border: 0;height: auto;outline: 0;text-decoration: none;}table {border-collapse: collapse !important;}#bodyCell,#bodyTable,body {height: 100% !important;margin: 0;padding: 0;font-family: ProximaNova, sans-serif;}#bodyCell {padding: 20px;}#bodyTable {width: 600px;}@font-face {font-family: ProximaNova;src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.eot);src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.eot?#iefix)format("embedded-opentype"),url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.woff) format("woff");font-weight: 400;font-style: normal;}@font-face {font-family: ProximaNova;src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.eot);src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.eot?#iefix)format("embedded-opentype"),url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.woff) format("woff");font-weight: 600;font-style: normal;}@media only screen and (max-width: 480px) {#bodyTable,body {width: 100% !important;}a,blockquote,body,li,p,table,td {-webkit-text-size-adjust: none !important;}body {min-width: 100% !important;}#bodyTable {max-width: 600px !important;}#signIn {max-width: 280px !important;}}
    </style>
  </head>
  <body>
    <center>
      <table
        style='width: 600px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;margin: 0;padding: 0;font-family: "ProximaNova", sans-serif;border-collapse: collapse !important;height: 100% !important;'
        align="center"
        border="0"
        cellpadding="0"
        cellspacing="0"
        height="100%"
        width="100%"
        id="bodyTable"
      >
        <tr>
          <td
            align="center"
            valign="top"
            id="bodyCell"
            style='-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;margin: 0;padding: 20px;font-family: "ProximaNova", sans-serif;height: 100% !important;'
          >
            <div class="main">
              <p
                style="text-align: center;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%; margin-bottom: 30px;"
              >
                <img
                  src="https://stackref-static-assets.s3.amazonaws.com/images/final-fat-hands-logo-only-med.png"
                  alt="StackRef"
                  style="-ms-interpolation-mode: bicubic;border: 0;height: auto;line-height: 100%;outline: none;text-decoration: none;"
                />
              </p>

              <h1>Welcome to StackRef!</h1>

              <p>Thank you for signing up. Please verify your email address by clicking the following link:</p>

              <p><a href="{{ url }}">Confirm my account</a></p>

              <p>
                If you are having any issues with your account, please don’t hesitate to contact us by replying to
                this mail.
              </p>

              <br />
              Thanks!
              <br />

              <strong>The folks at StackRef</strong>

              <br /><br />
              <hr style="border: 2px solid #EAEEF3; border-bottom: 0; margin: 20px 0;" />
              <p style="text-align: center;color: #A9B3BC;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;">
                If you did not make this request, please contact us by replying to this mail.
              </p>
            </div>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>
BODY
}
