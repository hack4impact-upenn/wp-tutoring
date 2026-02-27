export function AboutPage() {
  return (
    <div>
      {/* General About Us Section */}
      <section className="py-12 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-8">
              About Us
            </h1>
            <div className="space-y-6 text-lg text-foreground/80 leading-relaxed">
              <p>
                The West Philadelphia Tutoring Project (WPTP) is the largest community engagement organization at the University of Pennsylvania, housed within Civic House and led by a student executive board and Program Coordinator. We provide free tutoring services to K-12 students in the West Philadelphia area both on-campus at Civic House and off-campus in our local public schools. Our body of over 300 tutors is compromised of Penn undergraduates and graduates who work weekly with students in a variety of subjects, to include test preparation.
              </p>
              <p>
                WPTP aims to promote mutually beneficial relationships between students at the university and within the community through tutoring sessions, community events, and educational conversations. Through our partnerships, we hope to foster greater academic performance and build a tight-knit community for our tutees. For our tutors, WPTP provides opportunities to engage with our neighbors, gain a greater understanding of education-related issues, and develop a sense of civic responsibility.
              </p>
              <p>
                We are always excited to welcome new tutees and their families to the WPTP community! If you are interested in getting involved, please sign up for our on-campus program through the applications tab on this website. We also value the voices of all of our community members; if you have any questions about or suggestions for the program, please get in touch with us. Contact information is listed on this site, and the doors of Civic House are open if you would like to speak to someone in person.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Prospective Tutors Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold text-primary mb-12">
              Prospective Tutors
            </h2>

            <div className="space-y-12">
              {/* Why Join WPTP */}
              <div>
                <h3 className="text-2xl font-semibold text-primary mb-4">
                  Why join WPTP?
                </h3>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Joining WPTP is an amazing way to build community both inside and outside of Penn. Through our on-campus and off-campus programs, you will have the ability to work one on one with a student from the Philadelphia area, working primarily on reading, writing, and math skills. This is a great opportunity to build community, learn about education-related issues, and develop a civic responsibility. We welcome any and all tutors!
                </p>
              </div>

              {/* How to Become a Tutor */}
              <div>
                <h3 className="text-2xl font-semibold text-primary mb-4">
                  How do I become a tutor?
                </h3>
                <div className="space-y-4 text-lg text-foreground/80 leading-relaxed">
                  <p>
                    The tutor application comes out at the beginning of each semester, and can be found under the applications tab of our website.
                  </p>
                  <p>
                    After tutors are placed in the program, there are mandatory Tutor Orientations that will go over best tutoring practices as well as broader educational issues and semester logistics. Students who fail to attend Tutor Orientation will not be able to participate in WPTP. Additionally, all tutors will be required to complete FBI and Pennsylvania clearances to ensure that all WPTP tutors are compliant with state and federal guidelines for working with children. Tutors cannot begin tutoring until they fill out the necessary documentation.
                  </p>
                </div>
              </div>

              {/* More Information */}
              <div>
                <h3 className="text-2xl font-semibold text-primary mb-4">
                  Where can I get more information?
                </h3>
                <div className="space-y-4 text-lg text-foreground/80 leading-relaxed">
                  <p>
                    Every tutor will be placed in a section headed by a section director. They will be your direct line of contact should anything occur. Please check out our Leadership page or contact our general email if you have or do not have communication with your section director.
                  </p>
                  <p>
                    Additionally, we have a Canvas page that has many important resources and events posted. Please complete this form or let your section director know if you cannot access the page.
                  </p>
                  <p>
                    Lastly, follow our Instagram for frequent updates!
                  </p>
                </div>
              </div>

              {/* Get More Involved */}
              <div>
                <h3 className="text-2xl font-semibold text-primary mb-4">
                  Want to get more involved?
                </h3>
                <div className="space-y-4 text-lg text-foreground/80 leading-relaxed">
                  <p>
                    Consider becoming a Section Director to gain leadership skills and work closely with our school partners! Section Directors lead our on-campus and off-campus tutoring sessions. Applications for Section Directors will be released at the end of each term and will be published on our Canvas page.
                  </p>
                  <p>
                    Also consider applying for Executive Board! The Executive Board of WPTP works hard to make sure the entire organization runs smoothly and is compromised of five committees: communications, operations, education, outreach, and logistics. Joining board is a great way to help shape the future of WPTP. Applications for the Executive Board will be released at the end of each term and will be published on our Canvas page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
