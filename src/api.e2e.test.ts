import supertest from "supertest";
import { TestServerFixture } from "./tests/fixtures";

describe('Webinar Routes E2E', () => {
    let fixture: TestServerFixture;
  
    beforeAll(async () => {
      fixture = new TestServerFixture();
      await fixture.init();
    });
  
    beforeEach(async () => {
      await fixture.reset();
    });
  
    afterAll(async () => {
      await fixture.stop();
    });
    it('should create a webinar', async () => {
        const server = fixture.getServer();
        const prisma = fixture.getPrismaClient();
    
        const webinar = await prisma.webinar.create({
            data: {
              id: 'test-webinar',
              title: 'Webinar Test',
              seats: 10,
              startDate: new Date(),
              endDate: new Date(),
              organizerId: 'test-user',
            },
          });
    
        expect(webinar).toHaveProperty('id', 'test-webinar');
        const createdWebinar = await prisma.webinar.findUnique({
            where: { id: 'test-webinar' }
        });
        expect(createdWebinar).not.toBeNull();
    });
    
    it('should update webinar seats', async () => {
        // ARRANGE
        const prisma = fixture.getPrismaClient();
        const server = fixture.getServer();
    
        const webinar = await prisma.webinar.create({
          data: {
            id: 'test-webinar',
            title: 'Webinar Test',
            seats: 10,
            startDate: new Date(),
            endDate: new Date(),
            organizerId: 'test-user',
          },
        });
    
        // ACT
        const response = await supertest(server)
          .post(`/webinars/${webinar.id}/seats`)
          .send({ seats: '30' })
          .expect(200);
    
        // ASSERT
        expect(response.body).toEqual({ message: 'Seats updated' });
    
        const updatedWebinar = await prisma.webinar.findUnique({
          where: { id: webinar.id },
        });
        expect(updatedWebinar?.seats).toBe(30);
      });

    it('should return WebinarNotFoundException', async () => {
        const server = fixture.getServer();
    
        const response = await supertest(server)
            .post('/webinars/non-existent-id/seats')
            .send({ seats: '30' })
            .expect(404);
    
        expect(response.body).toEqual({ error: 'Webinar not found' });
    });

    it('should return WebinarNotOrganizerException', async () => {
        const server = fixture.getServer();
        const prisma = fixture.getPrismaClient();
      
        const webinar = await prisma.webinar.create({
          data: {
            id: 'webinar-003',
            title: 'Webinar Not Organizer Test',
            seats: 10,
            startDate: new Date(),
            endDate: new Date(),
            organizerId: 'test-organizer',
          },
        });
      
        const response = await supertest(server)
          .post(`/webinars/${webinar.id}/seats`)
          .send({ seats: '50' })
          .set('Authorization', 'Bearer non-organizer-token') 
          .expect(401); 
      
        expect(response.body).toEqual({
          error: 'User is not allowed to update this webinar',
        });
      
        const updatedWebinar = await prisma.webinar.findUnique({
          where: { id: webinar.id },
        });
        expect(updatedWebinar?.seats).toBe(10);
    });
    
  });