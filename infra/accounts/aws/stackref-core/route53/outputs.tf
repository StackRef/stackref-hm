output "stackref_com_zone_id" {
  value = aws_route53_zone.stackref_com.zone_id
}

output "stackref_com_name_servers" {
  value = aws_route53_zone.stackref_com.name_servers
}

output "stackref_io_zone_id" {
  value = aws_route53_zone.stackref_io.zone_id
}

output "stackref_io_name_servers" {
  value = aws_route53_zone.stackref_io.name_servers
}

output "s6f_io_zone_id" {
  value = aws_route53_zone.s6f_io.zone_id
}

output "s6f_io_name_servers" {
  value = aws_route53_zone.s6f_io.name_servers
}
