import { testUser } from "src/users/tests/user-seeds";
import { InMemoryWebinarRepository } from "../adapters/webinar-repository.in-memory";
import { ChangeSeats } from "./change-seats";
import { Webinar } from "../entities/webinar.entity";


describe('Feature : Change seats', () => {
  let webinarRepository: InMemoryWebinarRepository;
  let useCase: ChangeSeats;

  const webinar = new Webinar({
      id: 'webinar-id',
      organizerId: testUser.alice.props.id,
      title: 'Webinar title',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-01T01:00:00Z'),
      seats: 100,
  });

  beforeEach(() => {
      webinarRepository = new InMemoryWebinarRepository([webinar]);
      useCase = new ChangeSeats(webinarRepository);
  });

  async function whenUserChangeSeatsWith(payload: { user: any; webinarId: string; seats: number }) {
    await useCase.execute(payload);
  }

  function expectWebinarToRemainUnchanged() {
    const webinar = webinarRepository.findByIdSync('webinar-id');
    expect(webinar?.props.seats).toEqual(100);
  }

  async function thenUpdatedWebinarSeatsShouldBe(expectedSeats: number) {
    const updatedWebinar = await webinarRepository.findById('webinar-id');
    expect(updatedWebinar?.props.seats).toEqual(expectedSeats);
  }

  describe('Scenario: Happy path', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 200,
    };
    it('should change the number of seats for a webinar', async () => {
      // ACT
      await whenUserChangeSeatsWith(payload);
      // ASSERT
      await thenUpdatedWebinarSeatsShouldBe(200);
    });
  });
  describe('Scenario: webinar does not exist', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'non-existent-webinar-id',
      seats: 200,
    };
    it('should fail', async () => {
      // ACT & ASSERT
    await expect(useCase.execute(payload)).rejects.toThrow('Webinar not found');

    // ASSERT: Ensure the repository is unchanged
    expectWebinarToRemainUnchanged();
    });
  });
  describe('Scenario: update the webinar of someone else', () => {
    const payload = {
      user: testUser.bob,
      webinarId: 'webinar-id',
      seats: 200,
    };
    it('should fail', async () => {
      // ACT & ASSERT
      await expect(useCase.execute(payload)).rejects.toThrow('User is not allowed to update this webinar');
  
      // ASSERT: Ensure the repository is unchanged
      expectWebinarToRemainUnchanged();
    });
  });
  describe('Scenario: change seat to an inferior number', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 50,
    };
  
    it('should fail', async () => {
      // ACT & ASSERT
      await expect(useCase.execute(payload)).rejects.toThrow('You cannot reduce the number of seats');
  
      // ASSERT: Ensure the repository is unchanged
      expectWebinarToRemainUnchanged();
    });
  });
  describe('Scenario: change seat to a number > 1000', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 1500,
    };
  
    it('should fail', async () => {
      // ACT & ASSERT
      await expect(useCase.execute(payload)).rejects.toThrow('Webinar must have at most 1000 seats');
  
      // ASSERT: Ensure the repository is unchanged
      expectWebinarToRemainUnchanged();
    });
  });
});