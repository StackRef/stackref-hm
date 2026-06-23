resource "aws_cloudfront_origin_access_identity" "primary_frontend" {
  comment = "${var.environment == "prod" ? "app" : var.environment}.acme.example.com"
}

data "aws_cloudfront_origin_request_policy" "AllViewer" {
  name = "Managed-AllViewer"
}

data "aws_cloudfront_response_headers_policy" "CORS-with-preflight-and-SecurityHeadersPolicy" {
  name = "Managed-CORS-with-preflight-and-SecurityHeadersPolicy"
}

data "aws_cloudfront_cache_policy" "CachingOptimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "CachingDisabled" {
  name = "Managed-CachingDisabled"
}

resource "aws_cloudfront_origin_request_policy" "sentry" {
  name    = "sentry_${var.environment}"
  comment = "Sentry"
  cookies_config {
    cookie_behavior = "none"
  }
  headers_config {
    header_behavior = "whitelist"
    headers {
      items = [
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "DSN",
        "Referer",
        "X-Sentry-Token",
        "X-Sentry-Auth"
      ]
    }
  }
  query_strings_config {
    query_string_behavior = "all"
  }
}

resource "aws_cloudfront_origin_access_control" "primary_frontend" {
  name                              = "${var.environment == "prod" ? "app" : var.environment}.acme.example.com"
  description                       = "${var.environment == "prod" ? "app" : var.environment}.acme.example.com access control"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "primary_frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "StackRef Primary Front-end - ${var.environment}"
  default_root_object = "index.html"
  aliases             = ["${var.environment == "prod" ? "app" : var.environment}.acme.example.com"]

  web_acl_id = aws_wafv2_web_acl.primary_frontend.arn

  logging_config {
    include_cookies = true
    bucket          = "${aws_s3_bucket.env_stackref_com_logs.id}.s3.amazonaws.com"
    prefix          = "cloudfront/"
  }

  # React code
  origin {
    domain_name              = aws_s3_bucket.env_stackref_com.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.primary_frontend.id
    origin_id                = "${var.environment == "prod" ? "app" : var.environment}.acme.example.com"
  }

  # API
  origin {
    connection_attempts = 3
    connection_timeout  = 10
    domain_name         = "api.acme.example.com"
    origin_id           = "api.acme.example.com"
    origin_path         = "/${var.api_version}"

    custom_header {
      name  = "X-SR-FromCloudFront"
      value = "true"
    }

    custom_header {
      name  = "X-SR-Environment"
      value = var.environment
    }

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 10
      origin_protocol_policy   = "https-only"
      origin_read_timeout      = 60
      origin_ssl_protocols = [
        "TLSv1.2",
      ]
    }
  }

  # CodeCommit
  origin {
    connection_attempts = 3
    connection_timeout  = 10
    domain_name         = "git-codecommit.us-east-1.amazonaws.com"
    origin_id           = "git-codecommit.us-east-1.amazonaws.com"

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 10
      origin_protocol_policy   = "https-only"
      origin_read_timeout      = 30
      origin_ssl_protocols = [
        "TLSv1.2",
      ]
    }
  }

  # Sentry
  origin {
    connection_attempts = 3
    connection_timeout  = 10
    domain_name         = "o1201254.ingest.sentry.io"
    origin_id           = "o1201254.ingest.sentry.io"

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 10
      origin_protocol_policy   = "https-only"
      origin_read_timeout      = 30
      origin_ssl_protocols = [
        "TLSv1.2",
      ]
    }
  }

  # /*
  default_cache_behavior {
    allowed_methods = [
      "DELETE",
      "HEAD",
      "GET",
      "OPTIONS",
      "PATCH",
      "POST",
      "PUT"
    ]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${var.environment == "prod" ? "app" : var.environment}.acme.example.com"

    cache_policy_id            = data.aws_cloudfront_cache_policy.CachingOptimized.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.CORS-with-preflight-and-SecurityHeadersPolicy.id

    compress               = true
    viewer_protocol_policy = "https-only"

    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.primary_frontend_redirect.qualified_arn
      include_body = true
    }

  }

  # /sentry (Sentry)
  ordered_cache_behavior {
    allowed_methods = [
      "DELETE",
      "GET",
      "HEAD",
      "OPTIONS",
      "PATCH",
      "POST",
      "PUT"
    ]
    cached_methods = [
      "GET",
      "HEAD"
    ]

    cache_policy_id            = data.aws_cloudfront_cache_policy.CachingDisabled.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.CORS-with-preflight-and-SecurityHeadersPolicy.id
    origin_request_policy_id   = aws_cloudfront_origin_request_policy.sentry.id

    compress               = false
    path_pattern           = "/sentry"
    target_origin_id       = "o1201254.ingest.sentry.io"
    viewer_protocol_policy = "https-only"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.sentry_viewer_request.arn
    }
  }

  # /v1/repos/* (CodeCommit)
  ordered_cache_behavior {
    allowed_methods = [
      "DELETE",
      "GET",
      "HEAD",
      "OPTIONS",
      "PATCH",
      "POST",
      "PUT"
    ]
    cached_methods = [
      "GET",
      "HEAD"
    ]

    cache_policy_id            = data.aws_cloudfront_cache_policy.CachingDisabled.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.CORS-with-preflight-and-SecurityHeadersPolicy.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.AllViewer.id

    compress               = false
    path_pattern           = "/v1/repos/*"
    target_origin_id       = "git-codecommit.us-east-1.amazonaws.com"
    viewer_protocol_policy = "https-only"
  }

  # /api/*
  ordered_cache_behavior {
    allowed_methods = [
      "DELETE",
      "GET",
      "HEAD",
      "OPTIONS",
      "PATCH",
      "POST",
      "PUT"
    ]
    cached_methods = [
      "GET",
      "HEAD"
    ]

    cache_policy_id            = data.aws_cloudfront_cache_policy.CachingDisabled.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.CORS-with-preflight-and-SecurityHeadersPolicy.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.AllViewer.id

    compress               = true
    path_pattern           = "/api/*"
    target_origin_id       = "api.acme.example.com"
    viewer_protocol_policy = "https-only"
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.allowed_countries
    }
  }

  # This is due to calls to paths ending in /, so we serve the index.html with a 200 response
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = {
    Name = "${var.environment}.acme.example.com"
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.stackref_com.arn
    minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method       = "sni-only"
  }

  depends_on = [
    aws_lambda_function.primary_frontend_redirect,
    aws_s3_bucket.env_stackref_com_logs,
    aws_cloudfront_function.sentry_viewer_request
  ]
}

resource "aws_cloudfront_function" "sentry_viewer_request" {
  name    = "sentry_viewer_request_${var.environment}"
  runtime = "cloudfront-js-1.0"
  comment = "Redirect through tunnel to true Sentry endpoint API"
  publish = true
  code    = file("${path.module}/cloudfront_functions/sentry_viewer_request.js")
}
