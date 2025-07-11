import Image, { StaticImageData } from 'next/image'
import { motion } from 'framer-motion'
import { GithubIcon } from 'src/components/Icons/icons'

const WebsiteIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" height="1.25em" viewBox="0 0 512 512">
    <path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192C2.8 212.5 0 233.9 0 256s2.8 43.5 8.1 64H131.2c-2.1-20.6-3.2-42-3.2-64s1.1-43.4 3.2-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z" />
  </svg>
)

interface TeamMemberProps {
  image: StaticImageData
  name: string
  website?: string
  institution: string
  role: string
  github?: string
  index?: number
}

export const TeamMember = ({
  image,
  name,
  website,
  institution,
  role,
  github,
  index = 0,
}: TeamMemberProps) => {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.3,
        delay: 0.1 + ((index * 0.05) % 0.5),
        ease: 'easeOut',
      }}
    >
      <Image
        src={image}
        className="h-32 w-32 rounded-full md:h-40 md:w-40"
        alt={`Picture of ${name}`}
      />
      <div className="flex flex-col">
        {website ? (
          <a
            target="_blank"
            rel="noreferrer"
            href={website}
            className="text-lg text-human-3 transition duration-200 hover:text-human-4 md:text-xl"
          >
            {name}
          </a>
        ) : (
          <span className="text-base text-primary md:text-xl">{name}</span>
        )}
        <p className="text-sm text-primary md:text-base">{institution}</p>
        <div className="mt-1 flex flex-col gap-2">
          <p className="text-xs font-semibold text-primary md:text-sm">
            {role}
          </p>
          <div className="flex items-center justify-center space-x-2">
            {website && (
              <a
                target="_blank"
                rel="noreferrer"
                href={website}
                className="opacity-80 transition-opacity duration-300 *:h-4 *:w-4 *:fill-primary hover:opacity-100"
                aria-label={`Visit ${name}'s website`}
              >
                {WebsiteIcon}
              </a>
            )}
            {github && (
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://github.com/${github}`}
                className="opacity-80 transition-opacity duration-300 *:h-4 *:w-4 *:fill-primary hover:opacity-100"
                aria-label={`Visit ${name}'s GitHub profile`}
              >
                {GithubIcon}
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
