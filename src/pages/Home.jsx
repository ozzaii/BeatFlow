import React from 'react';
import { Box, VStack, Heading, Text, Button, Container, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const Home = () => {
  const bgGradient = useColorModeValue(
    'linear(to-r, brand.500, accent.500)',
    'linear(to-r, brand.400, accent.400)'
  );

  return (
    <Container maxW="container.xl" py={20}>
      <VStack spacing={8} textAlign="center">
        <Heading
          as="h1"
          size="4xl"
          bgGradient={bgGradient}
          bgClip="text"
          letterSpacing="tight"
          lineHeight="1.2"
          fontWeight="extrabold"
        >
          Create, Collaborate, Compete
        </Heading>
        
        <Text fontSize="xl" color="gray.500" maxW="2xl">
          Welcome to BeatFlow, your next-gen social beat-making platform. Create amazing beats, collaborate with other artists, and compete in beat battles.
        </Text>

        <Box pt={6}>
          <Button
            as={RouterLink}
            to="/studio"
            size="lg"
            colorScheme="brand"
            px={8}
            fontSize="md"
            fontWeight="bold"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'lg',
            }}
          >
            Start Making Beats
          </Button>
        </Box>
      </VStack>
    </Container>
  );
};

export default Home; 