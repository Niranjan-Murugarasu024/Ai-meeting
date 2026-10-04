from typing import List, Dict, Any, Optional

class GoldenMeetingSample:
    def __init__(
        self,
        sample_id: str,
        title: str,
        accent_category: str,
        noise_level: str,
        audio_snr_db: float,
        reference_transcript: str,
        ground_truth_actions: List[Dict[str, Any]],
        ground_truth_decisions: List[str],
        dataset_split: str = "held_out_test", # "dev" (20%) or "held_out_test" (80%)
        is_adversarial: bool = False,
        adversarial_type: Optional[str] = None
    ):
        self.sample_id = sample_id
        self.title = title
        self.accent_category = accent_category
        self.noise_level = noise_level
        self.audio_snr_db = audio_snr_db
        self.reference_transcript = reference_transcript
        self.ground_truth_actions = ground_truth_actions
        self.ground_truth_decisions = ground_truth_decisions
        self.dataset_split = dataset_split
        self.is_adversarial = is_adversarial
        self.adversarial_type = adversarial_type

# 50-Meeting Corpus: 10 Dev/Tuning Samples (20%) + 40 Held-Out Test Samples (80%)
GOLDEN_BENCHMARK_SET: List[GoldenMeetingSample] = [
    # ==================== DEV / TUNING SET (10 Samples) ====================
    GoldenMeetingSample(
        sample_id="DEV-01",
        title="[Dev] Bangalore DB Migration Calibration",
        accent_category="Indian English",
        noise_level="Moderate Office Noise",
        audio_snr_db=18.5,
        reference_transcript="Good morning team. We need to deploy the Redis cluster caching by Friday. Priya please verify the latency benchmarks.",
        ground_truth_actions=[{"desc": "Deploy Redis cluster caching by Friday", "owner": "Priya", "due_date": "Friday"}],
        ground_truth_decisions=["Deploy Redis cluster caching"],
        dataset_split="dev"
    ),
    GoldenMeetingSample(
        sample_id="DEV-02-ADV",
        title="[Dev] Sarcastic Outage Brainstorm (Tuning Case)",
        accent_category="Indian English",
        noise_level="Moderate Noise",
        audio_snr_db=17.0,
        reference_transcript="Yeah, right! Why don't we just delete the entire production database and rewrite everything in COBOL by tomorrow morning! Let's be serious and just roll back the latest PR.",
        ground_truth_actions=[],
        ground_truth_decisions=["Roll back latest PR"],
        dataset_split="dev",
        is_adversarial=True,
        adversarial_type="Sarcasm & Rhetorical Hyperbole"
    ),
    GoldenMeetingSample(
        sample_id="DEV-03",
        title="[Dev] London OAuth Architecture",
        accent_category="British English",
        noise_level="Clean Audio",
        audio_snr_db=32.0,
        reference_transcript="Right then, we are going to migrate the authentication provider to OAuth 2.0. Marcus please update the developer documentation by next Tuesday.",
        ground_truth_actions=[{"desc": "Update developer documentation by next Tuesday", "owner": "Marcus", "due_date": "Tuesday"}],
        ground_truth_decisions=["Migrate authentication provider to OAuth 2.0"],
        dataset_split="dev"
    ),
    GoldenMeetingSample(
        sample_id="DEV-04-ADV",
        title="[Dev] Tentative Haskell Rewrite Musings",
        accent_category="British English",
        noise_level="Moderate Fan Noise",
        audio_snr_db=20.0,
        reference_transcript="We could perhaps look into rewriting the microservices in Haskell at some point in the next few years, but let's not make any plans for now. We will keep Node.js.",
        ground_truth_actions=[],
        ground_truth_decisions=["Maintain Node.js runtime"],
        dataset_split="dev",
        is_adversarial=True,
        adversarial_type="Tentative Brainstorming"
    ),
    GoldenMeetingSample(
        sample_id="DEV-05",
        title="[Dev] Silicon Valley UX Sprint",
        accent_category="North American",
        noise_level="Low Ambient Noise",
        audio_snr_db=28.0,
        reference_transcript="Let's approve the dark mode redesign for mobile. Sarah will coordinate the UX asset handoff by October 12th.",
        ground_truth_actions=[{"desc": "Coordinate UX asset handoff by October 12th", "owner": "Sarah", "due_date": "2026-10-12"}],
        ground_truth_decisions=["Approve dark mode redesign for mobile"],
        dataset_split="dev"
    ),
    GoldenMeetingSample(
        sample_id="DEV-06-ADV",
        title="[Dev] Explicit Veto on MongoDB",
        accent_category="North American",
        noise_level="Clean",
        audio_snr_db=31.0,
        reference_transcript="Should Alex spin up a MongoDB cluster for the logs? No, absolutely not, Marcus vetoed that. We will use DynamoDB instead.",
        ground_truth_actions=[],
        ground_truth_decisions=["Use DynamoDB for logs, reject MongoDB proposal"],
        dataset_split="dev",
        is_adversarial=True,
        adversarial_type="Explicit Proposal Veto"
    ),
    GoldenMeetingSample(
        sample_id="DEV-07",
        title="[Dev] Sydney Onboarding Launch",
        accent_category="Australian English",
        noise_level="Low Fan Noise",
        audio_snr_db=24.0,
        reference_transcript="We will launch the self-serve onboarding flow on Monday. Liam will conduct the QA sanity checks.",
        ground_truth_actions=[{"desc": "Conduct QA sanity checks for self-serve flow", "owner": "Liam", "due_date": "Monday"}],
        ground_truth_decisions=["Launch self-serve onboarding flow on Monday"],
        dataset_split="dev"
    ),
    GoldenMeetingSample(
        sample_id="DEV-08",
        title="[Dev] Berlin Cloud Security",
        accent_category="European / Slavic",
        noise_level="Moderate Background Hum",
        audio_snr_db=19.0,
        reference_transcript="We must isolate the database VPC. Elena will configure the Terraform security group rules before Thursday.",
        ground_truth_actions=[{"desc": "Configure Terraform security group rules before Thursday", "owner": "Elena", "due_date": "Thursday"}],
        ground_truth_decisions=["Isolate database VPC with dedicated security groups"],
        dataset_split="dev"
    ),
    GoldenMeetingSample(
        sample_id="DEV-09",
        title="[Dev] Singapore Tier One SLA",
        accent_category="East Asian English",
        noise_level="Clean",
        audio_snr_db=30.5,
        reference_transcript="Let's standardize the SLA response time to under two hours for tier one enterprise customers. David please notify account managers.",
        ground_truth_actions=[{"desc": "Notify account managers about tier one SLA update", "owner": "David", "due_date": None}],
        ground_truth_decisions=["Standardize tier one SLA response time to under two hours"],
        dataset_split="dev"
    ),
    GoldenMeetingSample(
        sample_id="DEV-10",
        title="[Dev] Polyglot Hindi-English Bot Sync",
        accent_category="Multi-Language Code-Switching",
        noise_level="Moderate Café Noise",
        audio_snr_db=15.0,
        reference_transcript="Bilkul, we will enable automated Slack notifications on meeting end. Rahul please test the webhook endpoint.",
        ground_truth_actions=[{"desc": "Test webhook endpoint for Slack notifications", "owner": "Rahul", "due_date": None}],
        ground_truth_decisions=["Enable automated Slack notifications on meeting end"],
        dataset_split="dev"
    ),

    # ==================== HELD-OUT TEST SET (40 Samples) ====================
    # --- Bucket 1: Indian English (Held-Out N=6) ---
    GoldenMeetingSample(
        sample_id="TEST-IND-01",
        title="Delhi Fintech Security Compliance Sync",
        accent_category="Indian English",
        noise_level="Low Background Hum",
        audio_snr_db=22.5,
        reference_transcript="Under India DPDP we must pin data to Mumbai ap-south-1. Sneha will review the AWS encryption keys before next week.",
        ground_truth_actions=[{"desc": "Review AWS ap-south-1 encryption keys before next week", "owner": "Sneha", "due_date": "Next week"}],
        ground_truth_decisions=["Enforce data residency in AWS ap-south-1"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-IND-02",
        title="Heavy Noise Construction Zone Standup",
        accent_category="Indian English",
        noise_level="Heavy Noise (8.5 dB SNR)",
        audio_snr_db=8.5,
        reference_transcript="We decided to postpone the minor release by two days. Niranjan will inform stakeholders.",
        ground_truth_actions=[{"desc": "Inform stakeholders about two day release postponement", "owner": "Niranjan", "due_date": None}],
        ground_truth_decisions=["Postpone minor release by two days"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-IND-03",
        title="Hyderabad Cloud Disaster Recovery Drill",
        accent_category="Indian English",
        noise_level="Clean",
        audio_snr_db=30.0,
        reference_transcript="We are setting up the DR standby region in ap-south-2 Hyderabad. Rohan will run the failover tests on Saturday.",
        ground_truth_actions=[{"desc": "Run failover tests for ap-south-2 Hyderabad DR on Saturday", "owner": "Rohan", "due_date": "Saturday"}],
        ground_truth_decisions=["Deploy DR standby cluster in ap-south-2 Hyderabad"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-IND-04",
        title="Pune API Gateway Throttling Review",
        accent_category="Indian English",
        noise_level="Moderate Echo",
        audio_snr_db=19.5,
        reference_transcript="Let's rate limit public tier endpoints to 500 requests per minute. Ananya will configure Redis token bucket rules by Tuesday.",
        ground_truth_actions=[{"desc": "Configure Redis token bucket rate limiting rules by Tuesday", "owner": "Ananya", "due_date": "Tuesday"}],
        ground_truth_decisions=["Rate limit public endpoints to 500 req/min"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-IND-05-ADV",
        title="Adversarial: Sarcastic Excel Migration Proposal",
        accent_category="Indian English",
        noise_level="Moderate Murmur",
        audio_snr_db=16.0,
        reference_transcript="Arre nahi yaar, I was only joking when I said we should manually verify all one million rows in Excel! We will run the automated SQL migration script instead.",
        ground_truth_actions=[],
        ground_truth_decisions=["Execute automated SQL migration script"],
        dataset_split="held_out_test",
        is_adversarial=True,
        adversarial_type="Multilingual Sarcasm Retraction"
    ),
    GoldenMeetingSample(
        sample_id="TEST-IND-06",
        title="Chennai Mobile SDK Performance Review",
        accent_category="Indian English",
        noise_level="Clean Studio",
        audio_snr_db=31.5,
        reference_transcript="We will reduce the iOS SDK binary size by five megabytes. Karthik will strip debug symbols before Thursday.",
        ground_truth_actions=[{"desc": "Strip debug symbols from iOS SDK before Thursday", "owner": "Karthik", "due_date": "Thursday"}],
        ground_truth_decisions=["Reduce iOS SDK binary size by 5MB"],
        dataset_split="held_out_test"
    ),

    # --- Bucket 2: British English (Held-Out N=6) ---
    GoldenMeetingSample(
        sample_id="TEST-GBR-01",
        title="Manchester Data Pipeline Sync",
        accent_category="British English",
        noise_level="Low Ambient Noise",
        audio_snr_db=26.0,
        reference_transcript="We agreed to increase the Kafka partition count to twelve. Oliver will monitor consumer lag over the weekend.",
        ground_truth_actions=[{"desc": "Monitor Kafka consumer lag over the weekend", "owner": "Oliver", "due_date": "Weekend"}],
        ground_truth_decisions=["Increase Kafka partition count to 12"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-GBR-02",
        title="Edinburgh Product Feature Review",
        accent_category="British English",
        noise_level="Moderate Echo",
        audio_snr_db=19.5,
        reference_transcript="We shall release the billing export feature on Thursday. Fiona will run the merchant smoke tests.",
        ground_truth_actions=[{"desc": "Run merchant smoke tests for billing export", "owner": "Fiona", "due_date": "Thursday"}],
        ground_truth_decisions=["Release billing export feature on Thursday"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-GBR-03",
        title="Bristol QA & Test Automation Review",
        accent_category="British English",
        noise_level="Clean",
        audio_snr_db=31.0,
        reference_transcript="Let's adopt Playwright for end-to-end testing across all repositories. Harry will set up the GitHub Actions workflow by Monday.",
        ground_truth_actions=[{"desc": "Set up GitHub Actions workflow for Playwright by Monday", "owner": "Harry", "due_date": "Monday"}],
        ground_truth_decisions=["Adopt Playwright for end-to-end testing"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-GBR-04",
        title="Leeds Infrastructure Cost Optimization",
        accent_category="British English",
        noise_level="Low Noise",
        audio_snr_db=27.0,
        reference_transcript="We will convert our non-production EC2 instances to Spot instances. George will apply the Terraform changes on Friday.",
        ground_truth_actions=[{"desc": "Apply Terraform changes for Spot instances on Friday", "owner": "George", "due_date": "Friday"}],
        ground_truth_decisions=["Switch non-prod EC2 instances to Spot"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-GBR-05-ADV",
        title="Adversarial: Vague Conversational Musing",
        accent_category="British English",
        noise_level="Moderate Noise",
        audio_snr_db=18.0,
        reference_transcript="Someone really ought to tidy up the legacy documentation folder one day. Anyhow, let's stick to our sprint deliverables.",
        ground_truth_actions=[],
        ground_truth_decisions=[],
        dataset_split="held_out_test",
        is_adversarial=True,
        adversarial_type="Ambiguous Passive Observation"
    ),
    GoldenMeetingSample(
        sample_id="TEST-GBR-06",
        title="Oxford Search Optimization Sync",
        accent_category="British English",
        noise_level="Clean",
        audio_snr_db=32.0,
        reference_transcript="We agreed to implement hybrid vector and keyword search. Charlotte will test recall metrics by Wednesday.",
        ground_truth_actions=[{"desc": "Test recall metrics for hybrid search by Wednesday", "owner": "Charlotte", "due_date": "Wednesday"}],
        ground_truth_decisions=["Implement hybrid vector and keyword search"],
        dataset_split="held_out_test"
    ),

    # --- Bucket 3: North American English (Held-Out N=6) ---
    GoldenMeetingSample(
        sample_id="TEST-USA-01",
        title="Austin DevOps Deployment Retrospective",
        accent_category="North American",
        noise_level="Clean",
        audio_snr_db=30.0,
        reference_transcript="We are adopting OpenTelemetry for distributed tracing. Jason will instrument the API gateway before the sprint ends.",
        ground_truth_actions=[{"desc": "Instrument API gateway with OpenTelemetry before sprint end", "owner": "Jason", "due_date": "Sprint end"}],
        ground_truth_decisions=["Adopt OpenTelemetry for distributed tracing"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-USA-02",
        title="New York Executive Budget Review",
        accent_category="North American",
        noise_level="Clean Studio",
        audio_snr_db=33.0,
        reference_transcript="We approve the Q4 budget allocation for AI infrastructure. Marcus will present the cost breakdown to the board on October 15th.",
        ground_truth_actions=[{"desc": "Present AI infrastructure cost breakdown to board on October 15th", "owner": "Marcus", "due_date": "2026-10-15"}],
        ground_truth_decisions=["Approve Q4 budget allocation for AI infrastructure"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-USA-03",
        title="Seattle Security Redaction & PII Vault Audit",
        accent_category="North American",
        noise_level="Low Noise",
        audio_snr_db=27.5,
        reference_transcript="All uploaded audio must be purged within thirty days per GDPR and DPDP. Alex will author the compliance script by Friday.",
        ground_truth_actions=[{"desc": "Author compliance script for 30-day audio purge", "owner": "Alex", "due_date": "Friday"}],
        ground_truth_decisions=["Enforce 30-day audio purge under GDPR and DPDP"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-USA-04",
        title="San Francisco Frontend Web Performance",
        accent_category="North American",
        noise_level="Moderate Office Noise",
        audio_snr_db=21.0,
        reference_transcript="We will migrate our icon system to inline SVG sprites. Jessica will measure bundle size reduction by Thursday.",
        ground_truth_actions=[{"desc": "Measure bundle size reduction from SVG sprites by Thursday", "owner": "Jessica", "due_date": "Thursday"}],
        ground_truth_decisions=["Migrate icon system to inline SVG sprites"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-USA-05-ADV",
        title="Adversarial: Sarcastic Hyperbole on Testing",
        accent_category="North American",
        noise_level="Clean",
        audio_snr_db=29.0,
        reference_transcript="Oh wonderful! Why don't we test in production without any backups at midnight! Seriously though, we will run the staging smoke test first.",
        ground_truth_actions=[],
        ground_truth_decisions=["Run staging smoke test before production"],
        dataset_split="held_out_test",
        is_adversarial=True,
        adversarial_type="Sarcasm & Rhetorical Hyperbole"
    ),
    GoldenMeetingSample(
        sample_id="TEST-USA-06",
        title="Denver Real-Time WebSocket Streaming",
        accent_category="North American",
        noise_level="Low Fan Noise",
        audio_snr_db=26.5,
        reference_transcript="We agreed to implement audio jitter buffer smoothing. Tyler will benchmark packet drop resilience by Monday.",
        ground_truth_actions=[{"desc": "Benchmark packet drop resilience for audio jitter buffer by Monday", "owner": "Tyler", "due_date": "Monday"}],
        ground_truth_decisions=["Implement audio jitter buffer smoothing"],
        dataset_split="held_out_test"
    ),

    # --- Bucket 4: Australian English (Held-Out N=5) ---
    GoldenMeetingSample(
        sample_id="TEST-AUS-01",
        title="Melbourne Payment Gateway Integration",
        accent_category="Australian English",
        noise_level="Clean",
        audio_snr_db=29.0,
        reference_transcript="We are enabling Apple Pay for AUD transactions. Chloe will test the webhook callbacks by Wednesday.",
        ground_truth_actions=[{"desc": "Test Apple Pay webhook callbacks by Wednesday", "owner": "Chloe", "due_date": "Wednesday"}],
        ground_truth_decisions=["Enable Apple Pay for AUD transactions"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-AUS-02",
        title="Brisbane Site Reliability Standup",
        accent_category="Australian English",
        noise_level="Moderate Room Reverberation",
        audio_snr_db=18.0,
        reference_transcript="Let's decrease container memory limits to two gigabytes. Cooper will apply the Helm chart updates tomorrow.",
        ground_truth_actions=[{"desc": "Apply Helm chart updates for memory limits tomorrow", "owner": "Cooper", "due_date": "Tomorrow"}],
        ground_truth_decisions=["Decrease container memory limits to 2GB"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-AUS-03",
        title="Perth Data Lake Architecture",
        accent_category="Australian English",
        noise_level="Low Ambient Noise",
        audio_snr_db=25.0,
        reference_transcript="We decided to use Apache Iceberg on S3. Jack will benchmark query latencies by Friday.",
        ground_truth_actions=[{"desc": "Benchmark Apache Iceberg query latencies by Friday", "owner": "Jack", "due_date": "Friday"}],
        ground_truth_decisions=["Adopt Apache Iceberg on S3 for data lake"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-AUS-04-ADV",
        title="Adversarial: Completed Past Actions Status",
        accent_category="Australian English",
        noise_level="Clean",
        audio_snr_db=30.0,
        reference_transcript="Just an update: I already merged the Stripe webhook pull request yesterday and deployed it to staging. Everything is verified.",
        ground_truth_actions=[],
        ground_truth_decisions=["Stripe webhook PR verified on staging"],
        dataset_split="held_out_test",
        is_adversarial=True,
        adversarial_type="Historical Completed Status"
    ),
    GoldenMeetingSample(
        sample_id="TEST-AUS-05",
        title="Adelaide Search Index Rebuild",
        accent_category="Australian English",
        noise_level="Moderate Hum",
        audio_snr_db=22.0,
        reference_transcript="We must re-index the catalog with semantic vector embeddings. Mia will execute the batch pipeline on Sunday.",
        ground_truth_actions=[{"desc": "Execute batch pipeline for catalog re-indexing on Sunday", "owner": "Mia", "due_date": "Sunday"}],
        ground_truth_decisions=["Re-index catalog with semantic vector embeddings"],
        dataset_split="held_out_test"
    ),

    # --- Bucket 5: European / Slavic English (Held-Out N=6) ---
    GoldenMeetingSample(
        sample_id="TEST-EUR-01",
        title="Warsaw Microservices Migration",
        accent_category="European / Slavic",
        noise_level="Clean",
        audio_snr_db=28.5,
        reference_transcript="We agree to decommission the legacy monolith by end of Q4. Stanislav will route twenty percent of traffic to the new cluster.",
        ground_truth_actions=[{"desc": "Route 20% traffic to new microservices cluster", "owner": "Stanislav", "due_date": "End of Q4"}],
        ground_truth_decisions=["Decommission legacy monolith by end of Q4"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-EUR-02",
        title="Stockholm GDPR Data Erasure Review",
        accent_category="European / Slavic",
        noise_level="Low Noise",
        audio_snr_db=27.0,
        reference_transcript="We must automate GDPR Article 17 erasure requests. Astrid will implement the webhook handler by Tuesday.",
        ground_truth_actions=[{"desc": "Implement GDPR Article 17 webhook handler by Tuesday", "owner": "Astrid", "due_date": "Tuesday"}],
        ground_truth_decisions=["Automate GDPR Article 17 data erasure"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-EUR-03",
        title="Prague Frontend Performance Sync",
        accent_category="European / Slavic",
        noise_level="Moderate Office Murmur",
        audio_snr_db=21.0,
        reference_transcript="Let's lazy-load all dashboard charting components. Jan will measure Core Web Vitals improvements.",
        ground_truth_actions=[{"desc": "Measure Core Web Vitals after chart lazy-loading", "owner": "Jan", "due_date": None}],
        ground_truth_decisions=["Lazy-load dashboard charting components"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-EUR-04-ADV",
        title="Adversarial: Rejected Proposal on GraphQL",
        accent_category="European / Slavic",
        noise_level="Clean",
        audio_snr_db=29.0,
        reference_transcript="Should Stanislav rewrite all REST endpoints into GraphQL? No, the leadership rejected GraphQL. We will keep REST with OpenAPI specs.",
        ground_truth_actions=[],
        ground_truth_decisions=["Maintain REST with OpenAPI specs, reject GraphQL"],
        dataset_split="held_out_test",
        is_adversarial=True,
        adversarial_type="Explicit Proposal Veto"
    ),
    GoldenMeetingSample(
        sample_id="TEST-EUR-05",
        title="Amsterdam Multi-Tenant Isolation Review",
        accent_category="European / Slavic",
        noise_level="Clean",
        audio_snr_db=31.0,
        reference_transcript="We agree to enforce row-level security in PostgreSQL. Lars will write the migration scripts by Friday.",
        ground_truth_actions=[{"desc": "Write migration scripts for row-level security by Friday", "owner": "Lars", "due_date": "Friday"}],
        ground_truth_decisions=["Enforce row-level security in PostgreSQL"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-EUR-06",
        title="Zurich High-Security Key Rotation",
        accent_category="European / Slavic",
        noise_level="Low Ambient Hum",
        audio_snr_db=28.0,
        reference_transcript="We will automate monthly KMS master key rotation. Klaus will audit the CloudTrail access logs by Wednesday.",
        ground_truth_actions=[{"desc": "Audit CloudTrail access logs for KMS key rotation by Wednesday", "owner": "Klaus", "due_date": "Wednesday"}],
        ground_truth_decisions=["Automate monthly KMS master key rotation"],
        dataset_split="held_out_test"
    ),

    # --- Bucket 6: East Asian English (Held-Out N=6) ---
    GoldenMeetingSample(
        sample_id="TEST-EAS-01",
        title="Tokyo Multi-Region Latency Sync",
        accent_category="East Asian English",
        noise_level="Low Ambient Hum",
        audio_snr_db=26.0,
        reference_transcript="We will deploy edge caching nodes in Osaka and Tokyo. Kenji will configure the Cloudflare routing rules by Friday.",
        ground_truth_actions=[{"desc": "Configure Cloudflare routing rules for Osaka/Tokyo by Friday", "owner": "Kenji", "due_date": "Friday"}],
        ground_truth_decisions=["Deploy edge caching nodes in Osaka and Tokyo"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-EAS-02",
        title="Seoul Mobile App Release Review",
        accent_category="East Asian English",
        noise_level="Clean",
        audio_snr_db=32.0,
        reference_transcript="We agree to submit version 3.4 to the App Store tomorrow. Min-ho will generate the production build artifacts.",
        ground_truth_actions=[{"desc": "Generate production build artifacts for App Store tomorrow", "owner": "Min-ho", "due_date": "Tomorrow"}],
        ground_truth_decisions=["Submit mobile app version 3.4 to App Store"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-EAS-03",
        title="Hong Kong Trading API Latency Audit",
        accent_category="East Asian English",
        noise_level="Moderate Room Echo",
        audio_snr_db=20.5,
        reference_transcript="Let's replace REST polling with WebSocket subscriptions. Wei will benchmark throughput under peak market load.",
        ground_truth_actions=[{"desc": "Benchmark WebSocket throughput under peak market load", "owner": "Wei", "due_date": None}],
        ground_truth_decisions=["Replace REST polling with WebSocket subscriptions"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-EAS-04-ADV",
        title="Adversarial: Held-Out Conditional Speculation",
        accent_category="East Asian English",
        noise_level="Clean",
        audio_snr_db=28.0,
        reference_transcript="We might want to spin up three extra GPU nodes if traffic surges past 50k RPS tonight, but only if alerts fire. For now, hold steady.",
        ground_truth_actions=[], # True negative on held-out test set
        ground_truth_decisions=["Hold existing GPU capacity unless 50k RPS alert triggers"],
        dataset_split="held_out_test",
        is_adversarial=True,
        adversarial_type="Conditional Speculative Trigger"
    ),
    GoldenMeetingSample(
        sample_id="TEST-EAS-05",
        title="Taipei Edge Inference Cluster Deployment",
        accent_category="East Asian English",
        noise_level="Moderate Noise",
        audio_snr_db=19.0,
        reference_transcript="We will quantize our Whisper Conformer model to INT8. Chen will verify accuracy loss on the validation split by Monday.",
        ground_truth_actions=[{"desc": "Verify Whisper Conformer INT8 accuracy loss on validation split by Monday", "owner": "Chen", "due_date": "Monday"}],
        ground_truth_decisions=["Quantize Whisper Conformer model to INT8"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-EAS-06",
        title="Kyoto Audio Preprocessing Pipeline Audit",
        accent_category="East Asian English",
        noise_level="Low Noise",
        audio_snr_db=27.0,
        reference_transcript="We decided to integrate WebRTC VAD voice activity detection. Yuto will benchmark false cutoffs before Wednesday.",
        ground_truth_actions=[{"desc": "Benchmark false cutoffs for WebRTC VAD by Wednesday", "owner": "Yuto", "due_date": "Wednesday"}],
        ground_truth_decisions=["Integrate WebRTC VAD voice activity detection"],
        dataset_split="held_out_test"
    ),

    # --- Bucket 7: Multi-Language / Polyglot Code-Switching (Held-Out N=5) ---
    GoldenMeetingSample(
        sample_id="TEST-POL-01",
        title="Polyglot Architecture Sync (German + English)",
        accent_category="Multi-Language Code-Switching",
        noise_level="Clean",
        audio_snr_db=29.0,
        reference_transcript="Genau, we must ensure zero data loss during failover. Lukas will execute the disaster recovery drill on Saturday.",
        ground_truth_actions=[{"desc": "Execute disaster recovery drill on Saturday", "owner": "Lukas", "due_date": "Saturday"}],
        ground_truth_decisions=["Schedule disaster recovery drill for Saturday"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-POL-02",
        title="Polyglot Deployment Sync (Spanish + English)",
        accent_category="Multi-Language Code-Switching",
        noise_level="Low Ambient Noise",
        audio_snr_db=24.5,
        reference_transcript="De acuerdo, we will migrate the search index to OpenSearch. Carlos will configure the cluster sizing by Thursday.",
        ground_truth_actions=[{"desc": "Configure OpenSearch cluster sizing by Thursday", "owner": "Carlos", "due_date": "Thursday"}],
        ground_truth_decisions=["Migrate search index to OpenSearch"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-POL-03",
        title="Polyglot Mobile Sync (French + English)",
        accent_category="Multi-Language Code-Switching",
        noise_level="Moderate Noise",
        audio_snr_db=18.5,
        reference_transcript="C'est bon, we agree to deprecate iOS 15 support next month. Antoine will update the Xcode deployment target.",
        ground_truth_actions=[{"desc": "Update Xcode deployment target to drop iOS 15", "owner": "Antoine", "due_date": "Next month"}],
        ground_truth_decisions=["Deprecate iOS 15 support next month"],
        dataset_split="held_out_test"
    ),
    GoldenMeetingSample(
        sample_id="TEST-POL-04-ADV",
        title="Adversarial: Sarcastic Manual Backup Joke",
        accent_category="Multi-Language Code-Switching",
        noise_level="Moderate Noise",
        audio_snr_db=16.5,
        reference_transcript="Bien sur, why don't we print all our database records on paper every evening! Obviously joking, we will rely on AWS S3 daily snapshots.",
        ground_truth_actions=[],
        ground_truth_decisions=["Rely on AWS S3 daily automated snapshots"],
        dataset_split="held_out_test",
        is_adversarial=True,
        adversarial_type="Sarcasm & Rhetorical Hyperbole"
    ),
    GoldenMeetingSample(
        sample_id="TEST-POL-05",
        title="Polyglot Microservices (Italian + English)",
        accent_category="Multi-Language Code-Switching",
        noise_level="Clean Studio",
        audio_snr_db=30.0,
        reference_transcript="Perfetto, we will introduce gRPC for internal service communications. Matteo will benchmark payload serialization by Friday.",
        ground_truth_actions=[{"desc": "Benchmark gRPC serialization throughput by Friday", "owner": "Matteo", "due_date": "Friday"}],
        ground_truth_decisions=["Introduce gRPC for internal service communications"],
        dataset_split="held_out_test"
    )
]
