import logging
from faker import Faker

# Set up logging for the seed system
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'  # Keep it clean for the user
)
logger = logging.getLogger("seed")

# Initialize Faker with a fixed seed for reproducibility
fake = Faker('vi_VN')
Faker.seed(42)

def get_password_hash(password: str) -> str:
    """
    Mock password hash for seed data.
    """
    return f"$2b$12$fakedbcrypt_hash_for_seed_data_{password}_abcdefghijkl"

