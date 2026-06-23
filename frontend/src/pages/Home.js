import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import HomeHero from 'src/components/home/HomeHero';
import gtm from 'src/lib/gtm';

const Home = () => {
  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  return (
    <>
      <Helmet>
        <title>StackRef</title>
      </Helmet>
      <div>
        <HomeHero />
      </div>
    </>
  );
};

export default Home;
