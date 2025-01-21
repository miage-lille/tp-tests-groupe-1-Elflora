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
    
        const response = await supertest(server)
            .post('/webinars')
            .send({
                id: 'webinar-001',
                title: 'Test Webinar',
                seats: 50,
                startDate: new Date(),
                endDate: new Date(),
                organizerId: 'test-organizer'
            })
            .expect(201);
    
        expect(response.body).toHaveProperty('id', 'webinar-001');
        const createdWebinar = await prisma.webinar.findUnique({
            where: { id: 'webinar-001' }
        });
        expect(createdWebinar).not.toBeNull();
    });
    
    it('should update webinar seats', async () => {
        const server = fixture.getServer();
        const prisma = fixture.getPrismaClient();
    
        const webinar = await prisma.webinar.create({
            data: {
                id: 'webinar-002',
                title: 'Update Webinar Seats',
                seats: 20,
                startDate: new Date(),
                endDate: new Date(),
                organizerId: 'test-organizer'
            }
        });
    
        const response = await supertest(server)
            .post(`/webinars/${webinar.id}/seats`)
            .send({ seats: '30' })
            .expect(200);
    
        expect(response.body).toEqual({ message: 'Seats updated' });
    
        const updatedWebinar = await prisma.webinar.findUnique({
            where: { id: webinar.id }
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
    
  });