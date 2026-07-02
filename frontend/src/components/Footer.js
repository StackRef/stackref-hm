import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import RemoveIcon from '@mui/icons-material/Remove';
import { Logo } from './Logo';
import { useTheme } from '@mui/material/styles';

const sections = [
  {
    title: 'More Information',
    links: [
      {
        title: 'Documentation',
        href: 'https://docs.example.com',
      },
      {
        title: 'Privacy Policy',
        href: 'https://example.com/privacy-policy',
      },
      {
        title: 'Contact',
        href: 'mailto:info@example.com',
      },
    ],
  },
  {
    title: 'Social',
    links: [
      {
        title: 'Twitter',
        href: 'https://twitter.com/StackRef',
      },
      {
        title: 'GitHub',
        href: 'https://github.com/StackRef',
      },
    ],
  },
];

const Footer = (props) => (
  <Box
    sx={{
      bgcolor: useTheme().palette.background.default,
      pb: 6,
      pt: {
        md: 15,
        xs: 6,
      },
    }}
    {...props}
  >
    <Container maxWidth='lg'>
      <Grid container spacing={3}>
        <Grid
          item
          md={3}
          sm={4}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            order: {
              md: 1,
              xs: 4,
            },
          }}
          xs={12}
        >
          <Logo
            sx={{
              width: '60px',
              height: '60px',
            }}
          />
          <Box sx={{ mt: 1 }}>
            <Typography color='textSecondary' variant='caption'>
              <Button
                variant='contained'
                size='large'
                color='primary'
                target='_blank'
                rel='noopener noreferrer'
                href={`mailto:info@example.com`}
              >
                <Typography variant='button' style={{ fontSize: '0.69rem' }}>
                  support@example.com
                </Typography>
              </Button>
            </Typography>
          </Box>
        </Grid>
        {sections.map((section, index) => (
          <Grid
            item
            key={section.title}
            md={3}
            sm={4}
            sx={{
              order: {
                md: index + 2,
                xs: index + 1,
              },
            }}
            xs={12}
          >
            <Typography color='textSecondary' variant='overline'>
              {section.title}
            </Typography>
            <List disablePadding>
              {section.links.map((link) => (
                <ListItem
                  disableGutters
                  key={link.title}
                  sx={{
                    pb: 0,
                    pt: 1,
                  }}
                >
                  <ListItemAvatar
                    sx={{
                      alignItems: 'center',
                      display: 'flex',
                      minWidth: 0,
                      mr: 0.5,
                    }}
                  >
                    <RemoveIcon color='primary' />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Link
                        href={link.href}
                        color='textPrimary'
                        variant='subtitle2'
                        underline='hover'
                      >
                        {link.title}
                      </Link>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        ))}
      </Grid>
      <Divider
        sx={{
          borderColor: (theme) =>
            alpha(theme.palette.primary.contrastText, 0.12),
          my: 6,
        }}
      />
      <Typography color='textSecondary' variant='caption'>
        Copyright &copy;2022 StackRef, Inc. - All Rights Reserved.
      </Typography>
    </Container>
  </Box>
);

export default Footer;
