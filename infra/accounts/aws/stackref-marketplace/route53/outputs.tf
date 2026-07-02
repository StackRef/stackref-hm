output "awsmp_stackref_com_zone_id" {
  value = aws_route53_zone.awsmp_stackref_com.zone_id
}

output "awsmp_stackref_com_name_servers" {
  value = aws_route53_zone.awsmp_stackref_com.name_servers
}
