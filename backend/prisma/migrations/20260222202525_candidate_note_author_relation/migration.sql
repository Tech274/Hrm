-- AddForeignKey
ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
